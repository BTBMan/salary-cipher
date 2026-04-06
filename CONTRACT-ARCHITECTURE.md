# SalaryCipher — 合约架构设计

---

## 数据存储策略

并非所有数据都适合存在链上合约里，根据数据的敏感性和大小，采用不同的存储方案。

### 存储分层

| 数据 | 敏感性 | 存储位置 | 说明 |
|------|--------|----------|------|
| 薪资金额 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 接收钱包地址 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 谈判报价 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 公司名称 | 低 | 链上明文 | 数据量小，不敏感，直接存链上 |
| 员工显示名称 | 低 | 链上明文 | 数据量小，不敏感，直接存链上 |
| 公司 Logo | 低 | IPFS | 图片文件大，存链上 Gas 费极高 |
| 员工头像 | 低 | IPFS | 图片文件大，存链上 Gas 费极高 |
| 薪资证明 NFT 元数据 | 低 | IPFS | ERC721 标准的 tokenURI 指向 IPFS |

### 链上存储（合约）

敏感数据全部使用 Zama FHE 加密存储，非敏感的小体积数据（公司名、员工名）直接以明文 `string` 存储在合约中，无需 IPFS。

### IPFS 存储

**公司 Logo / 员工头像：**
- 前端上传图片到 IPFS，获得 CID
- 链上合约只存储 CID（`string` 类型），不存图片本身
- 前端通过 CID 拼接 IPFS 网关 URL 展示图片

**薪资证明 NFT 元数据：**
- 铸造前先将证明元数据（结论摘要、有效期、公司名等）上传 IPFS
- 获得 metadata JSON 的 CID 作为 `tokenURI` 传入铸造函数
- metadata 内容示例：
```json
{
  "name": "Salary Proof #001",
  "description": "Monthly salary ≥ 5,000 USDC — Verified on-chain",
  "attributes": [
    { "trait_type": "Proof Type", "value": "GTE" },
    { "trait_type": "Company", "value": "Acme Corp" },
    { "trait_type": "Verified", "value": "true" },
    { "trait_type": "Expiry", "value": "2026-07-06" }
  ]
}
```
注意：metadata 中**不包含具体薪资数字**，只包含结论性描述。

### CompanyRegistry 存储字段更新

```
companyId → Company {
  name,          // string，明文，链上
  owner,         // address，明文，链上
  createdAt,     // uint256，明文，链上
  logoCID        // string，IPFS CID，链上存引用
}

address → EmployeeProfile {
  displayName,   // string，明文，链上
  avatarCID      // string，IPFS CID，链上存引用
}
```

### Hackathon 阶段简化策略

- **Logo 和头像**：直接跳过 IPFS 上传，前端用钱包地址自动生成 Jazzicon 图案代替，零成本零依赖
- **员工显示名称**：保留，存链上明文
- **薪资证明 NFT metadata**：必须实现 IPFS 上传，因为 NFT 铸造流程需要 tokenURI

---

## 设计原则

- **全局单例合约**，用 `companyId` 命名空间隔离数据（而不是每家公司部署一套合约，否则 Gas 成本和管理复杂度都很高）
- **职责单一**，每个合约只做一件事
- **访问控制集中**，所有合约的权限校验都指向同一个 Registry

---

## 合约依赖关系图

```
CompanyRegistry （核心：角色与权限）
        ↑
        │ 权限校验
   ┌────┼────────────────────┐
   │    │                    │
PayrollVault   ConfidentialPayroll   SalaryNegotiation
（资金池）      （薪资逻辑）            （谈判撮合）
                    │
              ┌─────┴─────┐
         SalaryProof   FairnessAudit
         （收入证明）    （公平审计）
```

---

## 各合约详细说明

---

### 1. `CompanyRegistry.sol`

整个系统的权限中心，其他所有合约都依赖它做角色校验。

```
存储：
  companyId → Company { name, owner, createdAt }
  companyId → address[] employees
  companyId → address → Role (Owner/HR/Employee)

核心函数：
  createCompany(name) → companyId
  addEmployee(companyId, address, role)
  removeEmployee(companyId, address)
  getRole(companyId, address) → Role
  getUserCompanies(address) → companyId[]

modifier：
  onlyOwner(companyId)
  onlyOwnerOrHR(companyId)
  onlyMember(companyId)
```

---

### 2. `PayrollVault.sol`

管理每家公司的加密资金池，负责 USDC → 加密余额的转换。

```
存储：
  companyId → euint256 balance        （加密）

核心函数：
  deposit(companyId, usdcAmount)
    → 收取 USDC，增加加密余额
  withdraw(companyId, euint256 amount)
    → 仅 Owner，减少加密余额，发出 USDC
  getBalance(companyId) → euint256
    → 仅 Owner/HR 可解密

访问控制：
  deposit:     onlyOwner
  withdraw:    onlyOwner
  getBalance:  TFHE.allow() 给 Owner + HR
```

---

### 3. `ConfidentialPayroll.sol`

核心合约，处理薪资存储、发放和离职结算。

```
存储：
  companyId → address → euint256 monthlySalary     （加密）
  companyId → address → euint256 pendingPayout      （加密）
  companyId → address → eaddress receivingWallet    （加密）
  companyId → uint256 payrollCycle                  （明文：日期配置）
  companyId → uint256 lastPayrollTime               （明文）

核心函数：
  setSalary(companyId, employeeAddr, euint256 salary)
    → Owner/HR，设置或修改月薪
  setReceivingWallet(companyId, eaddress wallet)
    → Employee 本人，设置接收钱包
  executePayroll(companyId)
    → Owner 手动触发（V1），或定时触发（V2）
    → 遍历员工，从 PayrollVault 扣款，累加到 pendingPayout
  claimPayout(companyId)
    → Employee 本人，将 pendingPayout 提取到 receivingWallet
  terminateEmployee(companyId, employeeAddr)
    → 按天计算比例，立即结算 pendingPayout，再调 removeEmployee

解密权限（TFHE.allow）：
  monthlySalary：   本人 + Owner + HR
  pendingPayout：   本人 + Owner + HR
  receivingWallet： 本人 + Owner
```

---

### 4. `SalaryNegotiation.sol`

双方加密报价，合约在密文下比较，只输出匹配结论。

```
存储：
  negotiationId → Negotiation {
    companyId,
    employeeAddr,
    euint256 employerBudget,        （加密）
    euint256 employeeExpectation,   （加密）
    ebool matched,                  （加密）
    Status: Open / Matched / NoMatch
  }

核心函数：
  createNegotiation(companyId, employeeAddr)
    → Owner/HR 发起
  submitEmployerBudget(negotiationId, euint256 budget)
    → Owner/HR
  submitEmployeeExpectation(negotiationId, euint256 expectation)
    → Employee 本人
  computeMatch(negotiationId)
    → 任意人触发（双方都提交后才能调用）
    → ebool result = TFHE.le(employeeExpectation, employerBudget)
    → 写入 matched，更新 Status

解密权限：
  matched（ebool）：双方各自可解密，只看到 true / false
  原始报价：        永不对任何人开放解密
```

---

### 5. `FairnessAudit.sol`

在加密状态下计算薪资分布，输出聚合结论。

```
存储：
  companyId → auditId → AuditReport {
    timestamp,
    euint256 totalSalarySum,      （加密）
    uint256  headcount,           （明文，人数不敏感）
    ebool    gapWithinThreshold,  （加密，差距是否在合理范围）
  }

核心函数：
  generateAudit(companyId)
    → Owner/HR 触发
    → 遍历所有员工 monthlySalary 做累加（TFHE.add）
    → 计算最高/最低比值是否 < 配置阈值（TFHE.le）
    → 结果写入 AuditReport

解密权限：
  gapWithinThreshold（ebool）：Owner + HR
  totalSalarySum：              Owner only
```

---

### 6. `SalaryProof.sol`

生成隐私收入证明，可铸造为 NFT（ERC721）。

```
存储：
  proofId → Proof {
    companyId,
    employeeAddr,
    ProofType: GTE / BETWEEN / CONTINUOUS,
    euint256 threshold,     （加密）
    ebool    result,        （加密）
    uint256  expiry,
    bool     revoked
  }

核心函数：
  generateProof(companyId, ProofType, euint256 threshold, uint256 validity)
    → Employee 本人
    → 从 ConfidentialPayroll 读取 monthlySalary
    → result = TFHE.ge(monthlySalary, threshold)
    → 写入 Proof
  mintProofNFT(proofId)
    → Employee 本人，将 Proof 铸造为 ERC721
  verifyProof(proofId) → bool
    → 任何人调用，验证 result == true 且未过期未撤销
  revokeProof(proofId)
    → Employee 本人

解密权限：
  result（ebool）：本人 + 被授权的第三方验证地址
  threshold：      本人 only，永不对外开放
```

---

## 加密字段汇总

| 字段 | 合约 | Zama 类型 | 可见权限 |
|------|------|-----------|----------|
| 员工月薪 | ConfidentialPayroll | `euint256` | 本人 + Owner + HR |
| 累计待发薪资 | ConfidentialPayroll | `euint256` | 本人 + Owner + HR |
| 员工接收钱包 | ConfidentialPayroll | `eaddress` | 本人 + Owner |
| 公司资金池余额 | PayrollVault | `euint256` | Owner + HR |
| 雇主预算上限 | SalaryNegotiation | `euint256` | 合约内部，不对外开放 |
| 员工期望薪资 | SalaryNegotiation | `euint256` | 合约内部，不对外开放 |
| 谈判匹配结果 | SalaryNegotiation | `ebool` | 双方各自可解密 |
| 薪资总额（审计） | FairnessAudit | `euint256` | Owner only |
| 审计差距结论 | FairnessAudit | `ebool` | Owner + HR |
| 证明阈值 | SalaryProof | `euint256` | 本人 only |
| 证明比较结果 | SalaryProof | `ebool` | 本人 + 授权第三方 |

---

## 合约交互流程（关键场景）

### 发薪流程

```
Owner → PayrollVault.deposit()
Owner → ConfidentialPayroll.setSalary()（逐个员工）
Owner → ConfidentialPayroll.executePayroll()
Employee → ConfidentialPayroll.claimPayout()
```

### 谈判流程

```
Owner  → SalaryNegotiation.createNegotiation()
Owner  → SalaryNegotiation.submitEmployerBudget()
Employee → SalaryNegotiation.submitEmployeeExpectation()
任意方 → SalaryNegotiation.computeMatch()
双方   → 各自解密 matched（ebool），只看到 true / false
```

### 薪资证明流程

```
Employee → SalaryProof.generateProof()
Employee → SalaryProof.mintProofNFT()（可选）
第三方   → SalaryProof.verifyProof() → true / false
```

### 离职结算流程

```
Owner/HR → ConfidentialPayroll.terminateEmployee()
           ↓ 合约内部：按天计算比例结算 pendingPayout
           ↓ 自动调用 CompanyRegistry.removeEmployee()
Employee  → ConfidentialPayroll.claimPayout()（领取结算款）
```

---

## 部署顺序

```
1. CompanyRegistry
       ↓
2. PayrollVault          （依赖 CompanyRegistry 地址）
       ↓
3. ConfidentialPayroll   （依赖 CompanyRegistry + PayrollVault）
       ↓
4. SalaryNegotiation     （依赖 CompanyRegistry + ConfidentialPayroll）
5. FairnessAudit         （依赖 CompanyRegistry + ConfidentialPayroll）
6. SalaryProof           （依赖 CompanyRegistry + ConfidentialPayroll）
```

---

## Hackathon 阶段优先级

| 合约 | 优先级 | 理由 |
|------|--------|------|
| `CompanyRegistry` | P0 | 所有合约的权限基础，必须最先完成 |
| `ConfidentialPayroll` | P0 | 核心业务逻辑，最主要的 FHE 展示 |
| `PayrollVault` | P0 | 资金管理，发薪流程依赖 |
| `SalaryNegotiation` | P1 | FHE 双向加密撮合，评审亮点 |
| `SalaryProof` | P1 | RWA 叙事亮点，NFT 铸造 |
| `FairnessAudit` | P2 | 可在 Demo 中 mock 输出，时间不足可简化 |

---

## 数据存储策略

并非所有数据都适合存在链上合约里，根据数据的敏感性和大小，采用不同的存储方案。

### 存储分层

| 数据 | 敏感性 | 存储位置 | 说明 |
|------|--------|----------|------|
| 薪资金额 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 接收钱包地址 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 谈判报价 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 公司名称 | 低 | 链上明文 | 数据量小，不敏感，直接存链上 |
| 员工显示名称 | 低 | 链上明文 | 数据量小，不敏感，直接存链上 |
| 公司 Logo | 低 | IPFS | 图片文件大，存链上 Gas 费极高 |
| 员工头像 | 低 | IPFS | 图片文件大，存链上 Gas 费极高 |
| 薪资证明 NFT 元数据 | 低 | IPFS | ERC721 标准的 tokenURI 指向 IPFS |

### 链上存储（合约）

敏感数据全部使用 Zama FHE 加密存储，非敏感的小体积数据（公司名、员工名）直接以明文 `string` 存储在合约中，无需 IPFS。

### IPFS 存储

**公司 Logo / 员工头像：**
- 前端上传图片到 IPFS，获得 CID
- 链上合约只存储 CID（`string` 类型），不存图片本身
- 前端通过 CID 拼接 IPFS 网关 URL 展示图片

**薪资证明 NFT 元数据：**
- 铸造前先将证明元数据（结论摘要、有效期、公司名等）上传 IPFS
- 获得 metadata JSON 的 CID 作为 `tokenURI` 传入铸造函数
- metadata 内容示例：
```json
{
  "name": "Salary Proof #001",
  "description": "Monthly salary ≥ 5,000 USDC — Verified on-chain",
  "attributes": [
    { "trait_type": "Proof Type", "value": "GTE" },
    { "trait_type": "Company", "value": "Acme Corp" },
    { "trait_type": "Verified", "value": "true" },
    { "trait_type": "Expiry", "value": "2026-07-06" }
  ]
}
```
注意：metadata 中**不包含具体薪资数字**，只包含结论性描述。

### CompanyRegistry 存储字段更新

```
companyId → Company {
  name,          // string，明文，链上
  owner,         // address，明文，链上
  createdAt,     // uint256，明文，链上
  logoCID        // string，IPFS CID，链上存引用
}

address → EmployeeProfile {
  displayName,   // string，明文，链上
  avatarCID      // string，IPFS CID，链上存引用
}
```

### Hackathon 阶段简化策略

- **Logo 和头像**：直接跳过 IPFS 上传，前端用钱包地址自动生成 Jazzicon 图案代替，零成本零依赖
- **员工显示名称**：保留，存链上明文
- **薪资证明 NFT metadata**：必须实现 IPFS 上传，因为 NFT 铸造流程需要 tokenURI

---

*文档版本：v1.0 | 创建日期：2026-04-06*

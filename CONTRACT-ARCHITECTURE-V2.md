# SalaryCipher — 合约架构设计 V2

---

## V1 → V2 核心优化

| 维度 | V1 | V2 | 改进 |
|------|----|----|------|
| 合约数量 | 6 | 5 | 减少 1 个，但更重要的是减少耦合 |
| 跨合约 FHE 调用 | 4 处 | 1 处 | 大幅降低 Gas 和复杂度 |
| eaddress 使用 | 有 | 无 | 消除高风险依赖 |
| 发薪 Gas 风险 | 无分页 | 分页 | 支持大公司 |
| 审计 Gas 风险 | 无分页 | 分页 | 支持大公司 |
| 前端索引 | 无 Events | 全量 Events | 前端可高效监听 |
| 批量操作 | 无 | 批量添加员工 | 减少 tx 数量 |
| 谈判多轮 | 需新建 | 原地开新轮次 | UX 更流畅 |
| NFT 铸造 | 混在 Proof 中 | 独立合约 | 职责更清晰 |

---

## 设计原则

- **全局单例合约**，用 `companyId` 命名空间隔离数据（而不是每家公司部署一套合约，否则 Gas 成本和管理复杂度都很高）
- **职责单一**，每个合约只做一件事
- **访问控制集中**，所有合约的权限校验都指向同一个 CompanyRegistry
- **消除跨合约 FHE 共享**，操作相同加密数据的逻辑合并到同一合约内

---

## 数据存储策略

并非所有数据都适合存在链上合约里，根据数据的敏感性和大小，采用不同的存储方案。

### 存储分层

| 数据 | 敏感性 | 存储位置 | 说明 |
|------|--------|----------|------|
| 薪资金额 | 高 | 链上（FHE 加密） | 核心隐私数据，必须加密上链 |
| 接收钱包地址 | 低 | 链上明文 | V2 改为明文 address（提取时链上本就可见） |
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

### Hackathon 阶段简化策略

- **Logo 和头像**：直接跳过 IPFS 上传，前端用钱包地址自动生成 Jazzicon 图案代替，零成本零依赖
- **员工显示名称**：保留，存链上明文
- **薪资证明 NFT metadata**：必须实现 IPFS 上传，因为 NFT 铸造流程需要 tokenURI

---

## 合约依赖关系图

```
CompanyRegistry （权限中心，无 FHE）
        ↑
        │ 权限校验
   ┌────┼──────────────┐
   │    │              │
SalaryCipherCore    SalaryNegotiation
（资金池+薪资+审计）   （谈判撮合）
   │
   ├── SalaryProof     （收入证明）
   │      │
   └── ProofNFT        （ERC721 铸造）
```

**从 V1 的 6 个合约精简为 5 个，跨合约 FHE 调用从 4 处降为 1 处（仅 SalaryProof → SalaryCipherCore）。**

---

## 各合约详细说明

---

### 1. `CompanyRegistry.sol` — 权限中心

整个系统的权限中心，其他所有合约都依赖它做角色校验。不涉及任何 FHE 操作。

```
存储：
  nextCompanyId                                    // uint256，自增 ID
  companyId → Company { name, owner, createdAt }   // 明文
  companyId → address[] employees                  // 员工列表
  companyId → address → Role (None/Owner/HR/Employee)
  address → uint256[] userCompanies                // 反查：用户所属公司

核心函数：
  createCompany(name) → companyId
  addEmployee(companyId, employee, role, displayName)
  batchAddEmployees(companyId, employees[], roles[], names[])   // 批量添加
  removeEmployee(companyId, employee)
  updateRole(companyId, employee, newRole)
  getRole(companyId, address) → Role
  getUserCompanies(address) → uint256[]
  getEmployees(companyId) → address[]
  getEmployeeCount(companyId) → uint256

Events：
  CompanyCreated(companyId, owner, name)
  EmployeeAdded(companyId, employee, role)
  EmployeeRemoved(companyId, employee)
  RoleUpdated(companyId, employee, oldRole, newRole)

modifier：
  onlyOwner(companyId)
  onlyOwnerOrHR(companyId)
  onlyMember(companyId)
```

---

### 2. `SalaryCipherCore.sol` — 核心合约（合并 PayrollVault + ConfidentialPayroll + FairnessAudit）

**合并理由：** 这三个合约全部操作同一批 `euint256` 薪资数据。合并后：
- 资金池扣款 → 内部函数调用，无需跨合约 `TFHE.allow()`
- 审计遍历薪资 → 直接读内部 mapping，无需外部授权
- 减少约 40% 的 FHE 权限管理代码

```
存储：
  // === 资金池（原 PayrollVault）===
  companyId → euint256 companyBalance              // 加密：公司资金池余额

  // === 薪资数据（原 ConfidentialPayroll）===
  companyId → address → euint256 monthlySalary     // 加密：月薪
  companyId → address → euint256 pendingPayout     // 加密：累计待领
  companyId → address → address  receivingWallet   // 明文 address（去掉 eaddress）
  companyId → uint256 payrollCycle                  // 明文：发薪周期配置
  companyId → uint256 lastPayrollTime              // 明文：上次发薪时间
  companyId → address → uint256 startDate          // 明文：入职日期，用于离职按天结算

  // === 审计（原 FairnessAudit）===
  companyId → auditId → AuditReport {
    timestamp,
    euint256 totalSalarySum,
    uint256  headcount,
    ebool    gapWithinThreshold
  }

核心函数：

  // --- 资金管理 ---
  deposit(companyId, usdcAmount)
    → onlyOwner，收取 USDC，TFHE.add 到加密余额
  withdraw(companyId, plainAmount)
    → onlyOwner，TFHE.sub 加密余额，转出 USDC
  getBalance(companyId) → euint256
    → TFHE.allow(Owner, HR)

  // --- 薪资管理 ---
  setSalary(companyId, employee, einputEncryptedSalary, inputProof)
    → onlyOwnerOrHR
    → TFHE.allow(monthlySalary, [employee, owner, hr, salaryCipherCore, salaryProofAddr])
  setReceivingWallet(companyId, walletAddress)
    → onlyMember(本人)，明文地址

  // --- 发薪（分页）---
  executePayroll(companyId, startIndex, batchSize)
    → onlyOwner
    → 从 startIndex 开始处理 batchSize 个员工
    → 内部直接 TFHE.sub(companyBalance, salary) + TFHE.add(pendingPayout, salary)
    → 无跨合约调用

  claimPayout(companyId)
    → Employee 本人，解密 pendingPayout 并转出 USDC

  // --- 离职结算 ---
  terminateEmployee(companyId, employee)
    → onlyOwnerOrHR
    → 按天计算比例：(monthlySalary * daysWorked / 30) via TFHE.mul + TFHE.div
    → 累加到 pendingPayout
    → 调用 CompanyRegistry.removeEmployee()

  // --- 审计（分页）---
  generateAudit(companyId, startIndex, batchSize) → auditId
    → onlyOwnerOrHR
    → 分批累加薪资 TFHE.add，支持多次调用同一 auditId 追加
  finalizeAudit(companyId, auditId)
    → 计算最高/最低比值，写入 gapWithinThreshold

  // --- 供 SalaryProof 调用的内部接口 ---
  verifySalaryCondition(companyId, employee, conditionType, euint256 threshold) → ebool
    → 仅 SalaryProof 合约可调用（onlySalaryProof modifier）
    → 在本合约内完成比较，返回 ebool，避免薪资数据流出

Events：
  Deposited(companyId, amount)
  Withdrawn(companyId, amount)
  SalarySet(companyId, employee)                     // 不含金额
  PayrollExecuted(companyId, startIndex, count)
  PayoutClaimed(companyId, employee)
  EmployeeTerminated(companyId, employee)
  AuditGenerated(companyId, auditId)
  AuditFinalized(companyId, auditId)

解密权限（TFHE.allow）：
  companyBalance：  Owner + HR
  monthlySalary：   本人 + Owner + HR
  pendingPayout：   本人 + Owner + HR
  totalSalarySum：  Owner only
  gapWithinThreshold：Owner + HR
```

**`receivingWallet` 改为明文 `address` 的理由：**
- `eaddress` 是 PRD 假设 #1 标注的高风险项，当前版本可能不稳定
- 员工 `claimPayout` 提取时，链上转账的目标地址本就公开可见
- 去掉 `eaddress` 减少一类 FHE 操作，降低合约复杂度和 Gas

---

### 3. `SalaryNegotiation.sol` — 谈判撮合

其 FHE 数据（employer budget, employee expectation）与薪资数据完全独立，无需合并。

```
存储：
  nextNegotiationId
  negotiationId → Negotiation {
    companyId,
    employeeAddr,
    euint256 employerBudget,
    euint256 employeeExpectation,
    ebool    matched,
    Status:  Open / BothSubmitted / Matched / NoMatch,   // 细化状态
    uint256  round,                                       // 轮次
    uint256  createdAt
  }
  companyId → employee → uint256[] negotiationHistory    // 历史记录

核心函数：
  createNegotiation(companyId, employeeAddr) → negotiationId
    → onlyOwnerOrHR
  submitEmployerBudget(negotiationId, einput budget, inputProof)
    → onlyOwnerOrHR
  submitEmployeeExpectation(negotiationId, einput expectation, inputProof)
    → 仅指定 employee
  computeMatch(negotiationId)
    → 要求 status == BothSubmitted
    → matched = TFHE.le(employeeExpectation, employerBudget)
    → TFHE.allow(matched, [employer, employee])
    → 更新 status 为 Matched 或 NoMatch
  newRound(negotiationId)
    → 清空双方报价，round++，status → Open

Events：
  NegotiationCreated(negotiationId, companyId, employee)
  BudgetSubmitted(negotiationId)
  ExpectationSubmitted(negotiationId)
  MatchComputed(negotiationId)
  NewRoundStarted(negotiationId, round)

解密权限：
  matched（ebool）：双方各自可解密
  原始报价：        永不对任何人开放解密
```

---

### 4. `SalaryProof.sol` — 收入证明

**核心优化：** 不再跨合约读取薪资原始值。通过 `SalaryCipherCore.verifySalaryCondition()` 在 Core 内部完成比较，`SalaryProof` 只拿到 `ebool` 结果。薪资原始值永远不离开 Core 合约。

```
存储：
  nextProofId
  proofId → Proof {
    companyId,
    employeeAddr,
    ProofType: GTE / BETWEEN / CONTINUOUS,
    ebool    result,
    uint256  createdAt,
    uint256  expiry,
    bool     revoked,
    bool     minted                              // 是否已铸造 NFT
  }
  employee → uint256[] proofIds                  // 个人证明列表

核心函数：
  generateProof(companyId, ProofType, einput threshold, inputProof, validityDays)
    → Employee 本人
    → 调用 SalaryCipherCore.verifySalaryCondition()
    → Core 返回 ebool，本合约只存结果
    → TFHE.allow(result, [employee])

  authorizeVerifier(proofId, verifierAddress)
    → Employee 本人
    → TFHE.allow(result, verifier)

  revokeProof(proofId)
    → Employee 本人

  verifyProof(proofId) → (bool valid, bool expired, bool revoked)
    → 任何人，检查状态（不含 ebool 解密，只看链上明文状态）

  mintNFT(proofId, tokenURI)
    → Employee 本人，要求 result 已生成且 minted == false
    → 调用 ProofNFT.mint()

Events：
  ProofGenerated(proofId, companyId, employee, proofType)
  ProofRevoked(proofId)
  ProofNFTMinted(proofId, tokenId)
  VerifierAuthorized(proofId, verifier)

解密权限：
  result（ebool）：本人 + 被授权的第三方验证地址
```

---

### 5. `ProofNFT.sol` — ERC721 铸造

从 SalaryProof 拆出的独立 NFT 合约。NFT 是标准 ERC721，与 FHE 逻辑无关。拆出后 SalaryProof 更轻量，ProofNFT 可独立审计，也方便未来迁移到新的 NFT 标准。

```
继承：ERC721, ERC721URIStorage

存储：
  nextTokenId
  tokenId → proofId                       // 反查
  proofId → tokenId                       // 正查
  salaryProofContract                     // 唯一授权铸造者

核心函数：
  mint(to, proofId, tokenURI) → tokenId
    → 仅 SalaryProof 合约可调用

  // 标准 ERC721 接口自动继承
  tokenURI(tokenId) → string
  ownerOf(tokenId) → address
```

---

## 加密字段汇总

| 字段 | 合约 | Zama 类型 | 可见权限 |
|------|------|-----------|----------|
| 公司资金池余额 | SalaryCipherCore | `euint256` | Owner + HR |
| 员工月薪 | SalaryCipherCore | `euint256` | 本人 + Owner + HR + SalaryProof 合约 |
| 累计待领薪资 | SalaryCipherCore | `euint256` | 本人 + Owner + HR |
| 员工接收钱包 | SalaryCipherCore | `address` | **明文**（去掉 eaddress） |
| 审计薪资总额 | SalaryCipherCore | `euint256` | Owner only |
| 审计差距结论 | SalaryCipherCore | `ebool` | Owner + HR |
| 雇主预算上限 | SalaryNegotiation | `euint256` | 合约内部，不对外开放 |
| 员工期望薪资 | SalaryNegotiation | `euint256` | 合约内部，不对外开放 |
| 谈判匹配结果 | SalaryNegotiation | `ebool` | 双方各自可解密 |
| 证明比较结果 | SalaryProof | `ebool` | 本人 + 授权第三方 |

**FHE 加密字段：10 个（V1 为 11 个，去掉了 eaddress）**

---

## 合约交互流程（关键场景）

### 发薪流程

```
Owner → SalaryCipherCore.deposit()
Owner → SalaryCipherCore.setSalary()（逐个员工）
Owner → SalaryCipherCore.executePayroll(companyId, 0, 50)     // 分页：第 1 批
Owner → SalaryCipherCore.executePayroll(companyId, 50, 50)    // 分页：第 2 批
Employee → SalaryCipherCore.claimPayout()
```

### 谈判流程

```
Owner    → SalaryNegotiation.createNegotiation()
Owner    → SalaryNegotiation.submitEmployerBudget()
Employee → SalaryNegotiation.submitEmployeeExpectation()
任意方   → SalaryNegotiation.computeMatch()
双方     → 各自解密 matched（ebool），只看到 true / false
           ↓ 如不匹配
Owner    → SalaryNegotiation.newRound()                       // 开新轮次
```

### 薪资证明流程

```
Employee → SalaryProof.generateProof()
              ↓ 内部调用
           SalaryCipherCore.verifySalaryCondition()           // 薪资比较在 Core 内完成
Employee → SalaryProof.authorizeVerifier(verifierAddr)        // 授权第三方
Employee → SalaryProof.mintNFT(proofId, tokenURI)            // 可选：铸造 NFT
              ↓ 内部调用
           ProofNFT.mint()
第三方   → SalaryProof.verifyProof() → true / false
```

### 离职结算流程

```
Owner/HR → SalaryCipherCore.terminateEmployee()
              ↓ 合约内部：按天计算比例结算 pendingPayout
              ↓ 自动调用 CompanyRegistry.removeEmployee()
Employee → SalaryCipherCore.claimPayout()（领取结算款）
```

### 审计流程

```
Owner/HR → SalaryCipherCore.generateAudit(companyId, 0, 50)     // 分页：第 1 批
Owner/HR → SalaryCipherCore.generateAudit(companyId, 50, 50)    // 分页：第 2 批
Owner/HR → SalaryCipherCore.finalizeAudit(companyId, auditId)   // 计算结论
Owner/HR → 解密 gapWithinThreshold（ebool），只看到 true / false
```

---

## 部署顺序

```
1. CompanyRegistry
      ↓
2. SalaryCipherCore        （依赖 CompanyRegistry 地址）
      ↓
3. SalaryNegotiation       （依赖 CompanyRegistry）
4. ProofNFT                （无依赖）
      ↓
5. SalaryProof             （依赖 CompanyRegistry + SalaryCipherCore + ProofNFT）
      ↓
6. SalaryCipherCore.setSalaryProofAddress(SalaryProof)   // 授权回调
```

---

## Hackathon 阶段优先级

| 合约 | 优先级 | 理由 |
|------|--------|------|
| `CompanyRegistry` | P0 | 所有合约的权限基础，必须最先完成 |
| `SalaryCipherCore` | P0 | 核心业务逻辑，最主要的 FHE 展示，合并了资金池+薪资+审计 |
| `SalaryNegotiation` | P1 | FHE 双向加密撮合，评审亮点 |
| `SalaryProof` | P1 | RWA 叙事亮点 |
| `ProofNFT` | P1 | NFT 铸造，依赖 SalaryProof |

---

*文档版本：v2.0 | 创建日期：2026-04-06*

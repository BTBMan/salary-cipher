# SalaryCipher — 合约架构设计 V2

---

## V1 → V2 核心优化

| 维度            | V1            | V2           | 改进                            |
| --------------- | ------------- | ------------ | ------------------------------- |
| 合约数量        | 6             | 5            | 减少 1 个，但更重要的是减少耦合 |
| 跨合约 FHE 调用 | 4 处          | 1 处         | 大幅降低 Gas 和复杂度           |
| eaddress 使用   | 有            | 无           | 消除高风险依赖                  |
| 发薪 Gas 风险   | 无分页        | 分页         | 支持大公司                      |
| 审计 Gas 风险   | 无分页        | 分页         | 支持大公司                      |
| 前端索引        | 无 Events     | 全量 Events  | 前端可高效监听                  |
| 批量操作        | 无            | 批量添加员工 | 减少 tx 数量                    |
| 谈判多轮        | 需新建        | 原地开新轮次 | UX 更流畅                       |
| NFT 铸造        | 混在 Proof 中 | 独立合约     | 职责更清晰                      |

---

## 设计原则

- **全局单例合约**，用 `companyId` 命名空间隔离数据（而不是每家公司部署一套合约，否则 Gas 成本和管理复杂度都很高）
- **职责单一**，每个合约只做一件事
- **访问控制集中**，所有合约的权限校验都指向同一个 CompanyRegistry
- **减少跨合约 FHE 共享**，操作相同加密数据的逻辑尽量合并到同一合约内；需要跨合约流转时只传递明确授权的结果值

---

## 数据存储策略

并非所有数据都适合存在链上合约里，根据数据的敏感性和大小，采用不同的存储方案。

### 存储分层

| 数据                | 敏感性 | 存储位置         | 说明                                      |
| ------------------- | ------ | ---------------- | ----------------------------------------- |
| 薪资金额            | 高     | 链上（FHE 加密） | 核心隐私数据，必须加密上链                |
| 接收钱包地址        | 低     | 链上明文         | V2 改为明文 address（提取时链上本就可见） |
| 调薪谈判报价        | 高     | 链上（FHE 加密） | 已入职员工调薪时的核心隐私数据，必须加密上链 |
| 公司名称            | 低     | 链上明文         | 数据量小，不敏感，直接存链上              |
| 员工显示名称        | 低     | 链上明文         | 数据量小，不敏感，直接存链上              |
| 公司 Logo           | 低     | IPFS             | 图片文件大，存链上 Gas 费极高             |
| 员工头像            | 低     | IPFS             | 图片文件大，存链上 Gas 费极高             |
| 薪资证明 NFT 元数据 | 低     | IPFS             | ERC721 标准的 tokenURI 指向 IPFS          |

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
        │ 权限校验 / 公司配置
   ┌────┼──────────────────────┐
   │    │                      │
   │    │                  SalaryNegotiation
   │    │                    （谈判撮合）
   │    │
   │  SalaryCipherCore
   │  （薪资计算 + 发薪调度 + 审计）
   │        │
   │        ├── CompanyTreasuryVault  （公司独立资金金库）
   │        │         │
   │        │         └── ERC7984 / ERC7984Wrapper  （密文资产层）
   │        │
   │        ├── SalaryProof     （收入证明）
   │        │      │
   │        │      └── ProofNFT （ERC721 铸造）
   │        │
   │        └── Unwrap / Swap 合约（提现出口）
```

**真实资产转账采用“薪资业务层”和“资产层”拆分：`SalaryCipherCore` 负责算应发金额，`CompanyTreasuryVault + ERC7984` 负责真正转账。**

---

## 各合约详细说明

---

### 1. `CompanyRegistry.sol` — 权限中心

整个系统的权限中心，其他所有合约都依赖它做角色校验。不涉及任何 FHE 操作。

```
存储：
  nextCompanyId                                                // uint256，自增 ID
  companyId → Company { name, owner, createdAt }               // 明文
  companyId → address[] employees                              // 员工列表
  companyId → address → Employee { role, displayName, payoutWallet, addedAt }
  address → uint256[] userCompanies                            // 反查：用户所属公司
  companyId → PayrollConfig { dayOfMonth, initialized }        // 公司发薪配置
  companyId → settlementToken                                  // 公司使用的 confidential token
  companyId → treasuryVault                                    // 公司独立资金金库地址

核心函数：
  createCompany(name, payrollDayOfMonth) → companyId
  addEmployee(companyId, employee, role, displayName)
    → 默认写入 payoutWallet = employee
  batchAddEmployees(companyId, newEmployees[])                 // 批量添加，元素为 { account, displayName, role }
    → 默认写入 payoutWallet = account
  setPayoutWallet(companyId, payoutWallet)
    → 员工本人修改自己的收款地址
  setPayrollConfig(companyId, dayOfMonth)
  setSettlementToken(companyId, token)
  setTreasuryVault(companyId, vault)
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
  PayoutWalletUpdated(companyId, employee, payoutWallet)
  PayrollConfigUpdated(companyId, dayOfMonth)
  SettlementTokenUpdated(companyId, token)
  TreasuryVaultUpdated(companyId, vault)

modifier：
  onlyOwner(companyId)
  onlyOwnerOrHR(companyId)
  onlyMember(companyId)
```

---

### 2. `SalaryCipherCore.sol` — 核心合约（薪资计算 + 发薪调度 + FairnessAudit）

**设计调整：** `SalaryCipherCore` 不再自己持有公司资产，也不再维护“待领取工资”。它只负责：

- 维护加密月薪
- 计算每次发薪应发金额
- 调用公司金库完成真实 confidential transfer
- 生成审计结果

```
存储：
  // === 薪资数据 ===
  companyId → address → euint256 monthlySalary     // 加密：月薪
  companyId → uint256 lastPayrollTime              // 明文：上次发薪时间
  companyId → address → uint256 startDate          // 明文：入职日期，用于离职结算

  // === 审计（原 FairnessAudit）===
  companyId → auditId → AuditReport {
    timestamp,
    euint256 totalSalarySum,
    uint256  headcount,
    ebool    gapWithinThreshold
  }

核心函数：

  // --- 薪资管理 ---
  setSalary(companyId, employee, einputEncryptedSalary, inputProof)
    → onlyOwnerOrHR
    → 仅用于员工入职后的初始月薪写入
    → 如果 monthlySalary 已存在则 revert SalaryAlreadySet
    → 后续月薪调整必须走 SalaryNegotiation.setNegotiatedSalary()
    → TFHE.allow(monthlySalary, [employee, owner, hr, salaryCipherCore, salaryProofAddr])

  setNegotiatedSalary(companyId, employee, euint128 negotiatedSalary)
    → onlySalaryNegotiation
    → 仅用于匹配成功后的调薪谈判结果应用
    → 写入新的 monthlySalary，并刷新员工 / Owner / HR 解密权限

  // --- 发薪 ---
  executePayroll(companyId)
    → onlyOwner
    → 按 CompanyRegistry.payrollConfig 计算本次应结算区间
    → 读取员工 payoutWallet
    → 调用 CompanyTreasuryVault / ERC7984 执行真实 confidential transfer
    → 无 claim 步骤，发薪即到账

  // --- 离职结算 ---
  terminateEmployee(companyId, employee)
    → onlyOwnerOrHR
    → 只结算尚未覆盖的区间
    → 满整月直接发月薪；不足整月按上一个结算周期实际天数折算
    → 直接调用 CompanyTreasuryVault / ERC7984 转账到 payoutWallet
    → 调用 CompanyRegistry.removeEmployee()

  // --- 审计 ---
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
  SalarySet(companyId, employee)                     // 不含金额
  PayrollExecuted(companyId, count)
  EmployeeTerminated(companyId, employee)
  AuditGenerated(companyId, auditId)
  AuditFinalized(companyId, auditId)

解密权限（TFHE.allow）：
  monthlySalary：   本人 + Owner + HR
  totalSalarySum：  Owner only
  gapWithinThreshold：Owner + HR
```

**真实转账设计：**

- `SalaryCipherCore` 只算工资，不持币
- 每个公司对应一个 `CompanyTreasuryVault`
- `CompanyTreasuryVault` 持有该公司的 confidential token
- 发薪和离职结算都直接转到员工 `payoutWallet`
- `payoutWallet` 使用明文 `address`，因为真实链上转账目标地址本身就是公开的

---

### 3. `CompanyTreasuryVault.sol` — 公司独立资金金库

每家公司一个独立金库，负责托管公开 ERC20、wrap 成 confidential token，并授权 `SalaryCipherCore` 发薪。

```
存储：
  companyId
  companyRegistry
  settlementToken                           // ERC7984 / wrapper token
  underlyingToken                           // 如 USDC
  salaryCipherCore

核心函数：
  depositUnderlying(amount)
    → onlyOwner，存入公开 ERC20
  wrapUnderlying(amount)
    → 调用 ERC7984Wrapper，将公开 ERC20 转为 confidential token
  payrollTransfer(to, encryptedAmount, inputProof)
    → 仅 SalaryCipherCore 可调用
    → 真实将 confidential token 发到员工 payoutWallet
  withdrawUnusedUnderlying(amount, to)
    → onlyOwner，提取未使用资金

Events：
  UnderlyingDeposited(companyId, from, amount)
  UnderlyingWrapped(companyId, amount)
  PayrollTransferred(companyId, to)
  UnusedUnderlyingWithdrawn(companyId, to, amount)
```

---

### 4. `SalaryNegotiation.sol` — 已入职员工调薪谈判

用于已入职员工的加密调薪谈判。员工必须已经存在于公司内，并且已经配置过当前月薪；该合约不用于新员工入职前 offer。Owner 和员工本人都可以发起谈判，区别只在于谁先提交加密报价。

谈判数据独立存储，但匹配成功后可以通过 `SalaryCipherCore.setNegotiatedSalary()` 将匹配结果应用为员工新的正式月薪。

```
存储：
  nextNegotiationId
  negotiationId → Negotiation {
    companyId,
    employeeAddr,
    address  initiator,
    uint256  currentRound,
    Status:  Open / WaitingEmployerOffer / WaitingEmployeeAsk / ReadyToMatch / Computed / Applied / Cancelled,
    uint64   createdAt,
    uint64   updatedAt
  }
  negotiationId → round → NegotiationRound {
    euint128 employerOffer,
    euint128 employeeAsk,
    euint128 finalSalary,
    ebool    matched,
    bool     hasEmployerOffer,
    bool     hasEmployeeAsk,
    uint64   createdAt,
    uint64   resolvedAt
  }
  companyId → employee → uint256[] negotiationHistory    // 历史记录
  companyId → employee → uint256 activeNegotiationId     // 防止同一员工并发调薪

核心函数：
  createNegotiation(companyId, employeeAddr) → negotiationId
    → Owner 可为任意 HR / Employee 创建
    → 指定 employee 本人可为自己创建
    → employee 必须是已存在的 HR / Employee，不能是 Owner
    → employee 必须已有月薪
    → 同一员工不能存在未结束的 active negotiation
  submitEmployerOffer(negotiationId, einput offer, inputProof)
    → onlyOwner
    → 写入公司愿意调整到的新月薪
  submitEmployeeAsk(negotiationId, einput ask, inputProof)
    → 仅指定 employee
    → 写入员工希望调整到的新月薪
  computeMatch(negotiationId)
    → 要求 status == ReadyToMatch
    → matched = TFHE.le(employeeAsk, employerOffer)
    → finalSalary = employerOffer
    → TFHE.allow(matched, [owner, employee])
    → TFHE.allow(finalSalary, [owner, employee, SalaryCipherCore])
    → 更新 status 为 Computed
    → Match / No Match 由双方解密 matched 得到，不作为公开链上状态
  applyMatchedSalary(negotiationId)
    → onlyOwner
    → 要求 status == Computed
    → 前端应只在 Owner 解密 matched == true 后展示该操作
    → 调用 SalaryCipherCore.setNegotiatedSalary(companyId, employee, finalSalary)
    → status → Applied
  newRound(negotiationId)
    → onlyOwner 或指定 employee
    → 要求 status == Computed
    → 前端应只在双方解密 matched == false 后展示该操作
    → currentRound++，status → Open
  cancelNegotiation(negotiationId)
    → Owner 可取消任意未 Applied 谈判
    → 指定 employee 只能取消自己发起且未 Applied 的谈判
    → status → Cancelled

Events：
  NegotiationCreated(negotiationId, companyId, employee, initiator)
  EmployerOfferSubmitted(negotiationId, round)
  EmployeeAskSubmitted(negotiationId, round)
  MatchComputed(negotiationId, round)
  NegotiatedSalaryApplied(negotiationId, companyId, employee)
  NewRoundStarted(negotiationId, round)
  NegotiationCancelled(negotiationId)

解密权限：
  employerOffer：原始公司报价，不开放给任何外部账户解密
  employeeAsk：   原始员工要价，不开放给任何外部账户解密
  matched：       Owner 与指定 employee 可解密
  finalSalary：   匹配成功后的新月薪候选值，Owner 与指定 employee 可解密，并授权 SalaryCipherCore 应用
```

---

### 5. `SalaryProof.sol` — 收入证明

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

### 6. `ProofNFT.sol` — ERC721 铸造

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

| 字段             | 合约                 | Zama 类型  | 可见权限                             |
| ---------------- | -------------------- | ---------- | ------------------------------------ |
| 员工月薪         | SalaryCipherCore     | `euint256` | 本人 + Owner + HR + SalaryProof 合约 |
| 审计薪资总额     | SalaryCipherCore     | `euint256` | Owner only                           |
| 审计差距结论     | SalaryCipherCore     | `ebool`    | Owner + HR                           |
| 公司结算资产余额 | CompanyTreasuryVault | `euint256` | Owner + HR                           |
| 公司调薪报价     | SalaryNegotiation    | `euint128` | 合约内部，不对外开放                 |
| 员工调薪要价     | SalaryNegotiation    | `euint128` | 合约内部，不对外开放                 |
| 谈判匹配结果     | SalaryNegotiation    | `ebool`    | Owner + 指定 employee                |
| 匹配后的新月薪   | SalaryNegotiation    | `euint128` | 本人 + Owner + SalaryCipherCore      |
| 证明比较结果     | SalaryProof          | `ebool`    | 本人 + 授权第三方                    |

**FHE 加密字段已从“待领取账本模型”切换为“真实资产转账模型”：工资在发薪时直接到账，不再额外维护 pendingPayout。**

---

## 合约交互流程（关键场景）

### 发薪流程

```
Owner → CompanyTreasuryVault.depositUnderlying()
Owner → CompanyTreasuryVault.wrapUnderlying()
Owner/HR → SalaryCipherCore.setSalary()（逐个员工）
             ↓ setSalary 只允许设置初始月薪
Owner → SalaryCipherCore.executePayroll(companyId)
             ↓ 内部读取 payoutWallet
             ↓ 内部计算每位员工本期应发金额
             ↓ 调用 CompanyTreasuryVault.payrollTransfer()
Employee → 直接收到 confidential token
```

### 谈判流程

```
Owner 发起：
  Owner    → SalaryNegotiation.createNegotiation(employee)
  Owner    → SalaryNegotiation.submitEmployerOffer()           // 公司愿意调整到的新月薪
  Employee → SalaryNegotiation.submitEmployeeAsk()             // 员工希望调整到的新月薪

员工发起：
  Employee → SalaryNegotiation.createNegotiation(self)
  Employee → SalaryNegotiation.submitEmployeeAsk()
  Owner    → SalaryNegotiation.submitEmployerOffer()

双方都提交后：
  任意方   → SalaryNegotiation.computeMatch()
  链上状态 → Computed
  双方     → 各自解密 matched（ebool），只看到 Match / No Match
             ↓ 如匹配
  Owner    → SalaryNegotiation.applyMatchedSalary()
             ↓
  SalaryNegotiation → SalaryCipherCore.setNegotiatedSalary()
             ↓ 如不匹配
  Owner 或 Employee → SalaryNegotiation.newRound()
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
              ↓ 合约内部：只结算尚未覆盖区间
              ↓ 调用 CompanyTreasuryVault.payrollTransfer()
              ↓ 自动调用 CompanyRegistry.removeEmployee()
Employee → 直接收到离职结算 confidential token
```

### 提现流程

```
Employee → Unwrap / Swap 合约.unwrap()
              ↓ 烧毁 confidential token
              ↓ 网关返回解密结果和证明
Employee / Relayer → Unwrap / Swap 合约.finalizeUnwrap()
Employee → 收到公开 ERC20
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
3. CompanyTreasuryVault / VaultFactory
      ↓
4. ERC7984 / ERC7984Wrapper
      ↓
5. SalaryNegotiation       （依赖 CompanyRegistry + SalaryCipherCore）
6. ProofNFT                （无依赖）
      ↓
7. SalaryProof             （依赖 CompanyRegistry + SalaryCipherCore + ProofNFT）
      ↓
8. SalaryCipherCore.setSalaryProofAddress(SalaryProof)   // 授权回调
```

---

## Hackathon 阶段优先级

| 合约                   | 优先级 | 理由                                           |
| ---------------------- | ------ | ---------------------------------------------- |
| `CompanyRegistry`      | P0     | 所有合约的权限基础，必须最先完成               |
| `SalaryCipherCore`     | P0     | 核心业务逻辑，负责薪资计算、真实发薪调度、审计 |
| `CompanyTreasuryVault` | P0     | 真实资产转账入口，负责资金托管和发薪执行       |
| `SalaryNegotiation`    | P1     | 已入职员工加密调薪谈判，匹配成功后可更新正式月薪 |
| `SalaryProof`          | P1     | RWA 叙事亮点                                   |
| `ProofNFT`             | P1     | NFT 铸造，依赖 SalaryProof                     |

---

_文档版本：v2.0 | 创建日期：2026-04-06_

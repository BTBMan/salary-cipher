# SalaryCipher V3 Roadmap

## 目标

V3 用于承接当前版本暂不实现的公司合规、第三方验证和高级 RWA 能力。当前版本只实现两个闭环：Owner / HR 使用 Compliance 做薪资公平审计，HR / Employee 使用 Salary Proofs 生成个人隐私收入证明并 mint RWA NFT。

## 1. Company Compliance 扩展

V3 将 Compliance 从基础薪资公平审计扩展为完整公司合规中心。

计划功能：

- Payroll Compliance Ledger
- 公司发薪历史审计
- 金库资金流水审计
- 员工新增、编辑、删除记录审计
- 公司证明策略配置
- 审计报告导出
- 多维度薪资公平分析

## 2. Payroll Compliance Ledger

用于记录公司发薪是否按计划执行，并作为企业内部审计资料。

数据来源：

- `PayrollExecuted`
- `PayrollTransferred`
- deposit / withdraw events
- employee add / remove events

展示字段：

- Payroll Date
- Executed At
- Employee Count
- Settlement Token
- Encrypted Total Amount
- Block Number
- Transaction Hash
- Status

## 3. Proof Policy

公司可以配置员工能生成哪些 salary proofs。

配置项：

- 是否允许 salary threshold proof
- 是否允许 salary range proof
- 是否允许 employment duration proof
- proof 最大有效期
- 是否允许 mint NFT
- 是否需要公司签发背书

权限设计：

- Owner 可修改
- HR 可查看
- Employee 根据策略生成自己的证明

## 4. Third-party Verifier Portal

面向银行、房东、DeFi 协议或其他验证方的独立验证入口。

计划功能：

- Verifier 打开 proof link
- 查看 proof 是否存在、是否过期、是否撤销
- 请求员工授权
- 解密 proof result
- 验证 NFT 是否绑定有效 proof
- 检查 proof NFT 的 tokenURI 和 proofId 是否匹配

## 5. Advanced Salary Proofs

更复杂的证明类型放到 V3。

计划类型：

- 过去 N 个月连续收入证明
- 年收入区间证明
- 累计收入大于 X
- 平均月收入大于 X
- 当前雇佣状态证明
- 历史雇佣证明

## 6. Proof NFT 扩展

当前版本只实现基础 SVG 凭证图、IPFS metadata 和 mint。V3 再扩展 NFT 能力。

计划功能：

- 动态 SVG 模板
- 多主题 NFT 凭证
- 公司品牌定制
- Soulbound / transferable 策略
- NFT revoke 状态联动展示
- 第三方协议读取 proof NFT
- RWA credential 标准化

## 7. Enterprise Audit Report

公司级审计报告用于真实企业审计和外部合规场景。

计划功能：

- 生成公司审计报告
- 报告 hash 上链
- 报告文件上传 IPFS
- Owner / HR 下载报告
- 外部审计方授权查看

## 8. Compliance API

给第三方系统使用的验证接口。

计划能力：

- Proof verification API
- Company audit verification API
- NFT metadata API
- Verifier authorization callback
- Webhook / notification

## 暂不进入当前版本的原因

这些功能会显著增加合约、前端和权限设计复杂度。当前版本应优先保证基础薪资公平审计和员工个人 RWA 薪资证明可完整演示，V3 再扩展企业级合规和外部验证生态。

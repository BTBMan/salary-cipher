# Zama Bounty 表单回答草稿

## 项目名称

SalaryCipher

English: SalaryCipher

## 项目简介

SalaryCipher 是一个基于 Zama FHE 的多租户链上隐私薪资管理平台。多个公司可以在同一套合约系统中独立创建组织、选择 USDC / USDT 结算资产、拥有独立金库、管理员工、设置加密月薪、执行加密资产发薪，并进行加密调薪谈判、公司薪资公平审计和员工个人薪资证明。员工可以把自己的隐私薪资证明铸造成带 IPFS SVG 凭证图的 RWA NFT。薪资金额、公司资金池余额、谈判报价等敏感数据始终保持加密。

English: SalaryCipher is a multi-tenant private on-chain payroll platform powered by Zama FHE. Companies can create workspaces, choose USDC or USDT, use isolated treasury vaults, manage employees, store encrypted salaries, run encrypted payroll, negotiate salary changes privately, generate fairness audits, and issue salary proofs. Employees can mint private salary proofs as RWA NFTs with IPFS SVG credentials. Salaries, treasury balances, and negotiation offers remain encrypted.

## 解决的问题

普通链上转账会暴露每个员工的工资、公司人力成本和资金流向，这使企业很难把真实薪资系统迁移到区块链上。SalaryCipher 解决的是“链上支付可验证，但薪资隐私不能泄露”的矛盾：员工能收到真实链上资产，公司能保留透明可审计的操作记录，但工资金额、薪资结构、公司金库余额和调薪谈判底线不会公开给同事、竞争对手或链上观察者。同时，平台用 `companyId` 和独立金库支持多家公司共用一套基础设施，降低每家公司单独部署和维护合约的成本。

English: Normal on-chain payments expose salaries, labor costs, and fund flows, making real payroll hard to move on-chain. SalaryCipher keeps payroll verifiable while protecting salary privacy. Employees receive real on-chain assets, companies keep auditable records, and sensitive data such as salaries, salary structures, vault balances, and negotiation limits stay private. Its `companyId` and isolated vault design also lets many companies share one infrastructure without deploying separate systems.

## 如何使用 FHE

SalaryCipher 使用 Zama FHE 将核心薪资数据加密上链，并在密文状态下完成业务计算。员工月薪、发薪金额、金库 confidential token 余额、调薪报价、谈判匹配结果、审计结论和薪资证明结果都使用 `euint` / `ebool` 表示；合约可以在不知道明文金额的情况下计算按月发薪、离职结算、薪资比较、谈判匹配和收入条件验证。加密竞价功能中，Owner 的 employer offer 和员工的 employee ask 都不会公开，合约只输出加密的 Match / No Match 结果。薪资证明功能中，第三方可以验证“收入满足条件”，但不能看到真实薪资。前端只让被授权角色通过 Zama 解密自己有权限查看的数据，其他人只能看到加密字段。

English: SalaryCipher uses Zama FHE to store and compute payroll data in encrypted form. Monthly salaries, payroll amounts, confidential token balances, negotiation offers, match results, audit results, and salary proof results use `euint` / `ebool`. Contracts can calculate payroll, termination payouts, salary comparisons, negotiation matching, and income-condition checks without seeing plaintext values. In negotiation, both employer offers and employee asks stay private, and only an encrypted Match / No Match result is produced. In salary proofs, third parties can verify income conditions without seeing the actual salary. Only authorized users can decrypt permitted data through Zama.

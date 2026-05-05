# SalaryCipher — UI 设计稿生成 Prompt

---

## 产品概述

**SalaryCipher** 是一个基于 Zama Protocol FHE（全同态加密）的 Web3 企业 HR 薪资管理平台。薪资金额、接收钱包、资金池余额等敏感数据全程链上加密，仅授权角色可解密查看。PC 端网页，桌面优先（1280px+），深色科技风，参考 Linear / Coinbase 设计语言。

---

## 设计系统要求

- 所有颜色、字体、间距、圆角必须定义为 Design Token 变量，严禁硬编码
- 品牌主色为靛紫色系，加密相关元素统一使用紫色（`--color-encrypted`）作为视觉标识
- 字体分两套：正文用 Inter，链上地址/金额用 JetBrains Mono（等宽）
- 深色背景体系：base / surface / elevated / overlay 四层层次
- 功能色：success（绿）/ warning（黄）/ danger（红）/ info（蓝）

---

## 公共组件（必须抽离复用）

**基础组件：**
Button（Primary / Secondary / Ghost / Danger，含 loading 态）、Input（含加密标识变体：紫色左边框 + 锁图标前缀）、Badge、Avatar（钱包地址自动生成 Jazzicon）、Tag（角色色：Owner 金 / HR 蓝 / Employee 灰）、Tooltip、Toast（右上角，success/error/warning/info）、Divider

**复合组件：**

- **EncryptedField**（核心）：默认显示 `••••••` + 锁图标 + 紫色背景，点击眼睛图标触发钱包签名，签名成功后展示明文并倒计时自动遮蔽，可手动提前遮蔽
- **WalletAddress**：缩略格式 `0x1234...5678`，等宽字体，右侧一键复制
- **TokenAmount**：带 token 图标，支持加密态和明文态
- **Modal**（sm/md/lg）：遮罩 + 卡片 + Header/Body/Footer，含 ConfirmModal（危险操作二次确认）和 StepModal（多步骤，顶部步骤条）
- **DataTable**：支持排序、空态（EmptyState）、加载态（LoadingSkeleton）
- **RoleTag**：角色标识，用于公司列表和员工列表
- **CompanySwitcher**：Topbar 公司切换器，含公司名 + 角色 Tag + 下拉列表

---

## 页面结构总览

```
落地页（未登录）
连接钱包页
├── 无公司状态页
└── 主应用（有公司）
    ├── 概览 Overview
    ├── 人员 People
    │   └── 员工管理
    ├── 薪酬 Payroll
    │   ├── 薪资设置
    │   ├── 发薪记录
    │   └── 薪资谈判
    ├── 合规 Compliance
    │   ├── 薪资公平审计
    │   └── 薪资证明（RWA）
    ├── 财务 Finance
    │   └── 资金管理
    └── 设置 Settings
```

---

## 详细页面说明

---

### 一、落地页

顶部 Navbar：Logo（左）+ Connect Wallet 按钮（右）。Hero 区：大标题 + 副标题 + 「Launch App」主按钮 + 「View Docs」次按钮，背景深色渐变 + 抽象加密网格。三列功能亮点卡片：全程加密 / 多公司管理 / RWA 薪资证明。

---

### 二、连接钱包页

全屏居中卡片，SalaryCipher Logo + 「Connect your wallet to continue」标题，三个钱包选项（MetaMask / WalletConnect / Coinbase Wallet），每项含图标 + 名称 + 右箭头，hover 高亮。选中后显示 loading，其余 disabled。连接成功 toast 提示，自动跳转。

---

### 三、登录后：公司判断逻辑

**连接钱包后立即判断：**

**情况 A — 有公司（1家）：** 直接进入该公司主界面，无需选择。

**情况 B — 有公司（多家）：** 弹出「选择公司」Modal（不可关闭，必须选择才能进入），列表每一行显示：公司 Avatar + 公司名称 + 角色 Tag（Owner / HR / Employee）+ 员工人数 + 「Enter」按钮。底部有「+ Create New Company」次要链接。

**情况 C — 无公司：** 进入空白引导页（非主应用布局），页面居中显示两个选项卡：「Create a Company」（主，适合雇主）和「I've been invited」（次，适合员工等待邀请）。无任何菜单和功能入口。

---

### 四、主应用布局（所有功能页共用）

**Topbar（顶部固定，高60px）：**

- 左侧：**CompanySwitcher 组件** —— 显示当前公司 Avatar + 公司名 + 我的角色 Tag + 下拉箭头，点击展开下拉列表，列出所有公司（含角色标记），点击切换公司，切换后全局数据刷新、菜单根据新角色重新渲染；列表底部有「+ Create Company」选项
- 右侧：网络标识 Badge + 钱包 Avatar + 地址缩略

**Sidebar（左侧固定，宽220px）：**

- 顶部：SalaryCipher Logo
- 导航菜单（图标 + 文字，含 active/hover 状态）：
  - 概览 Overview（所有角色可见）
  - 人员 People（Owner/HR 完整权限；Employee 只读）
  - 薪酬 Payroll（Owner/HR 完整；Employee 只见个人数据）
  - 合规 Compliance（Owner/HR 完整；Employee 只能生成自己的证明）
  - 财务 Finance（仅 Owner 可见）
  - 设置 Settings（所有人可见，内容按角色裁剪）
- 底部：主题切换 + 断开连接按钮

**菜单权限规则：** 无权限的菜单项直接不显示（而非灰显），避免员工看到无法访问的功能造成困惑。

---

### 五、概览页 Overview

**所有角色可见，数据按角色过滤。**

顶部 4 个统计卡片（一行）：

- Owner/HR：管理员工数 / 本期应发总额（EncryptedField）/ 资金池剩余天数 / 下次发薪日倒计时
- Employee：我的月薪（EncryptedField）/ 累计待发（EncryptedField）/ 累计已收（EncryptedField）/ 下次发薪日倒计时

中部左列（60%）：最近薪资记录表，列含发放时间 / 金额（EncryptedField）/ 状态 Badge，底部「查看全部」跳转发薪记录页。

中部右列（40%）：

- Owner/HR：资金池健康度卡片（余额 EncryptedField + 可撑月数 + 颜色进度条）+ 待处理事项（资金不足警告 / 待确认谈判）
- Employee：薪资证明快捷入口卡片 + 最近生成的证明列表

---

### 六、人员页 People — 员工管理

**Owner/HR：完整管理权限。Employee：只读，看不到他人薪资。**

**页面顶部操作栏：**

- 搜索框（按姓名 / 钱包地址）
- 「+ Add Employee」按钮（Owner/HR 可见）

**员工列表（DataTable）：**

- 员工（Avatar + 钱包地址缩略）
- 角色 Tag
- 月薪（Owner/HR 显示 EncryptedField；Employee 自己行显示 EncryptedField，他人行显示「—」）
- 薪资接收钱包（Owner 显示 EncryptedField；本人显示 EncryptedField；他人显示「—」）
- 加入日期
- 状态（Active / Pending Badge）
- 操作列（Owner/HR 可见）：Edit 图标 + Remove 图标

**「Add Employee」弹出 StepModal（md，2步）：**

- Step 1：钱包地址输入（必填，格式校验）/ 角色选择（Employee / HR）/ 月薪（必填，带加密标识 Input）/ 薪资接收钱包（选填，带加密标识 Input，placeholder 提示「默认同员工地址」）
- Step 2：信息确认 + 「Add & Sign」按钮，触发钱包签名，签名中按钮 loading，签名完成关闭 Modal 并 toast 提示

**「Edit Employee」弹出 Modal（md）：**
预填当前值，只允许修改显示名称和角色。月薪字段只读展示，提示「Salary changes require negotiation」。月薪不能在员工编辑弹窗中直接修改。

**「Remove Employee」点击 Remove 图标：**
弹出 ConfirmModal（danger），标题「Remove Employee」，说明「本期累计薪资将立即发放」，显示结算金额（EncryptedField），「Remove & Pay Out」按钮触发签名，取消按钮。

**Employee 自己修改接收钱包：**
员工自己那行操作列显示「Edit Wallet」图标，点击弹出小 Modal，输入新地址，说明「地址将加密存储，仅你和雇主可见」，「Save & Sign」触发签名。

---

### 七、薪酬页 Payroll

Sidebar 中 Payroll 为可展开父项，含三个子页：

#### 7.1 薪资设置

**Owner/HR 可完整操作；Employee 只读查看自己的设置。**

页面分两区：

- 左：发薪周期设置（Select：每月1日 / 每月15日 / 每两周）+ 「Save」按钮（Owner/HR 可操作，Employee 只读）
- 右：员工薪资列表，月薪只读展示；调薪入口跳转到薪资谈判，不能直接 Edit 修改月薪

#### 7.2 发薪记录

**Owner/HR 看全部记录；Employee 只看自己的。**

顶部筛选栏：时间范围（本月 / 近3月 / 近6月 / 自定义）+ 状态筛选（全部 / Paid / Pending / Failed）

发薪记录表（DataTable）：发放日期 / 接收员工（Employee 视角显示「You」）/ 金额（EncryptedField）/ 状态 Badge / 「View Proof」链接

Owner/HR 视角表格底部显示期末汇总行：本期发放总额（EncryptedField）

#### 7.3 薪资谈判

**Owner/HR 管理谈判；Employee 提交自己的期望薪资。**

页面说明文字：「双方报价全程加密，合约自动匹配，仅告知结果。」

**Owner/HR 视角：**

- 待匹配员工列表：员工地址 / 状态（待员工报价 / 待雇主报价 / 已匹配 / 未匹配）/ 操作
- 对每个员工可设置「预算上限」（带加密标识 Input）并提交签名
- 已匹配行显示「✓ Match」绿色 Badge；未匹配显示「✗ No Match」红色 Badge

**Employee 视角：**

- 只看到自己的谈判状态卡片
- 可提交「期望薪资」（带加密标识 Input）并签名
- 状态显示：等待中 / 已匹配 / 未匹配（仅结论，无数字）

---

### 八、合规页 Compliance

Sidebar 中 Compliance 为可展开父项，含两个子页：

#### 8.1 薪资公平审计

**仅 Owner/HR 可见，菜单对 Employee 不显示。**

页面说明：「合约在加密状态下计算薪资分布，输出聚合结果，不暴露任何个体数据。」

配置区（卡片）：选择分析维度（部门 / 入职年限 / 角色），「Generate Report」按钮触发签名，签名中显示「Computing on encrypted data...」loading 态。

报告结果卡片（生成后展示）：

- 各维度薪资分布区间描述（结论性文字，无具体数字）
- 薪资差距指数结论（如「最高与最低比值在合理范围内」）
- 生成时间 + 报告哈希（等宽字体）
- 「Download Report」按钮

历史报告列表（DataTable）：生成时间 / 分析维度 / 报告哈希 / 操作（查看 / 下载）

#### 8.2 薪资证明（RWA）

**Owner/HR 可查看公司内所有证明记录；Employee 只能操作和查看自己的。**

页面说明：「生成链上隐私收入证明，无需暴露具体金额，可提交给租房 / 贷款 / DeFi 协议验证。」

**Employee 视角 — 生成证明区（卡片）：**

- 选择公司（如加入多家时显示 Dropdown）
- 证明类型 Select：月薪超过 X / 月薪在 X~Y 之间 / 过去 N 月持续有收入
- 阈值金额 Input
- 有效期 Select（7天 / 30天 / 永久）
- 「Generate Proof」按钮 → 触发签名 → loading 显示「Computing on encrypted data...」→ 成功后展示结果卡片：结论摘要（如「Monthly salary ≥ 5,000 USDC — Verified」）+ 证明 ID（链上哈希，等宽字体）+ 有效期 + 操作按钮：「Copy Proof Link」「Mint as NFT」

历史证明列表（DataTable）：公司 / 证明类型 / 生成时间 / 有效期 / 状态（Valid 绿 / Expired 灰）/ 操作（Copy / Revoke）。Revoke 触发 ConfirmModal。

---

### 九、财务页 Finance — 资金管理

**仅 Owner 可见，菜单对 HR/Employee 不显示。**

**左列：我的平台余额**

- 当前加密余额（EncryptedField，大号展示）
- 「Deposit」按钮：弹出 Modal，选择来源 Token（USDC / ETH），输入金额，预览获得的平台加密 Token 数，「Deposit & Encrypt」触发两步签名（Step 1/2 Approve → Step 2/2 Deposit），签名中按钮 loading + 步骤进度提示
- 「Withdraw」按钮：弹出 Modal，选择目标 Token，输入金额，接收地址（默认当前钱包可修改），Warning Banner 提示「提取后金额链上可见，建议使用独立钱包」，「Withdraw & Sign」触发签名

**右列：公司资金池**

- Dropdown 选择公司（如有多个）
- 当前资金池余额（EncryptedField）
- 健康度进度条（绿 / 黄 / 红）+ 可撑月数文字
- 快速充值按钮：+1月 / +3月 / 自定义金额
- 「Top Up」触发签名

**下方：交易历史表格**
时间 / 类型 Badge（Deposit / Withdraw / Payroll）/ 金额（EncryptedField）/ 状态 / Tx Hash 链接

---

### 十、设置页 Settings

**左侧锚点导航 + 右侧内容分区。**

**Profile（所有角色）：**
显示名称 Input + 头像上传，保存按钮

**Company（Owner 可见）：**
公司名称 / 描述修改，危险区域（解散公司，触发 ConfirmModal 二次确认 + 输入公司名验证）

**Notifications（所有角色，内容按角色裁剪）：**
Toggle 开关列表：薪资发放通知 / 资金不足预警（Owner）/ 员工变动通知（Owner/HR）/ 薪资证明到期提醒 / 谈判结果通知

**Security（所有角色）：**
EncryptedField 自动遮蔽延迟（3s / 5s / 10s / 手动）

**Appearance（所有角色）：**
深色/浅色主题切换，语言选择（EN / 中文）

---

## 通用交互规范

**加密字段解密：** 点击 EncryptedField 眼睛图标 → 小型 Confirm Tooltip（「需要钱包签名解密，确认查看？」）→ 触发签名 → 成功后明文展示 + 倒计时条 → 自动遮蔽

**链上签名操作：** 所有写入合约操作必须显示步骤指引（Step N/M），按钮 loading 态，顶部全局细进度条，成功/失败均有 Toast 反馈

**危险操作：** 移除员工、撤销证明、解散公司等，必须经过 ConfirmModal 二次确认，描述清楚操作后果

**角色切换（换公司）：** 切换公司后，Sidebar 菜单项根据新角色重新渲染（无权限菜单消失），页面数据全部刷新，当前页如无权限则自动跳转到 Overview

**空态：** 所有列表无数据时使用 EmptyState 组件（图标 + 标题 + 描述 + 可选 CTA）

**加载态：** 数据请求中使用 LoadingSkeleton 占位，不使用 spinner 整页加载

---

_文档版本：v1.0 | 创建日期：2026-04-06_

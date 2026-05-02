# HSC Truth Engine - Project Context

## 项目背景与愿景

**开发者身份**：目标是医学和精算专业的高三学生，正在申请顶尖大学奖学金（Tuckwell/Co-op）

**项目目标**：展现"领导力"和"数据透明化"能力。HSC 学生群体普遍误解 Scaling 和 Moderation 机制（如"学校会拉低我的分数"）。通过建立透明数据平台，利用统计学逻辑击碎谣言，帮助同学科学备考。

**核心理念**：向前人致敬（如 HSC Ninja），但不进行商业竞争。通过对官方数据的二次重构和逻辑拆解，展现准精算师解决信息不对称问题的能力。

**奖学金导向**：这是申请材料中的核心项目，体现：
- 领导力（解决群体性信息不对称）
- 数据分析能力（精算思维）
- 执行力（从零到 MVP 快速上线）

## 项目语言规则
- 讨论：所有决策、方案、技术讨论都用中文沟通
- 代码：所有文件中的变量名、函数名、注释、文档等全部用英文编写

## 技术栈
- Framework: Next.js (App Router), Tailwind CSS, Lucide React, Shadcn/UI
- Deployment: Vercel
- Math rendering: KaTeX / React-Markdown

## 三大核心模块

### 1. Honor Roll (事实引擎 / Fact Engine) ⏳
- 展示 NESA 官方 Distinguished Achievers (Band 6) 名单
- 2021-2025 年数据，按学校/科目/年份多维筛选
- 展示该校在该科目的 Band 6 集中度
- 需要：Playwright 爬虫 + 前端搜索 UI（或使用静态 JSON 数据源）
- 复杂度：最高（爬虫不确定因素多）
- 优先级：最后做

### 2. ATAR Calculator (工具引擎 / Tool Engine) 🔧
- 基于 UAC Table A3 线性插值算法
- 选取最佳 10 Unit（含 2 Unit 英语）计算 Aggregate
- 映射到 UAC Aggregate-to-ATAR Table A9
- 核心算法（线性插值）：
  ```
  y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
  ```
- 复杂度：中等
- 优先级：第二做

### 3. Insight Engine (洞察引擎 / Truth Engine) ✅
- 纯静态内容 + KaTeX LaTeX 公式渲染
- 解释 HSC Scaling/Moderation 运作机制
- 内容板块：
  - Moderation 的真相：为什么 Internal Rank 是唯一防线
  - Scaling 的本质：竞争强度而非科目难度
  - Z-score 公式：z = (x - μ) / σ，说明跨学科可比性
  - 谣言终结者：数据证明弱校第一名也能拿全州最高分
- 复杂度：最低（纯内容）
- 优先级：第一做

## 已提取的关键数据

### Table A9 (Aggregate → ATAR Mapping) - 2024
| ATAR  | Lowest Aggregate |
|-------|-----------------|
| 99.95 | 477.4           |
| 99.50 | 455.9           |
| 99.00 | 445.6           |
| 98.00 | 431.6           |
| 95.00 | 403.5           |
| 90.00 | 369.2           |
| 85.00 | 340.2           |
| 80.00 | 312.6           |
| 75.00 | 286.2           |
| 70.00 | 260.6           |
| 65.00 | 235.4           |
| 60.00 | 210.1           |
| 55.00 | 185.3           |
| 50.00 | 160.6           |

### Table A3 数据样本（部分科目）
- 英语科目：English Advanced mean=41.2 (hsc) / 32.7 (sca)
- 数学科目：Mathematics Advanced mean=39.4 (hsc) / 32.0 (sca)
- 理科科目：Biology mean=37.1 (hsc) / 26.0 (sca)
- 完整 Table A3 数据已从 PDF 提取，需要整理成结构化 JSON

## 关键文件
- `/Users/matthew/how does scaling work/scaling-report-2024-nsw-hsc.pdf` - UAC 官方Scaling报告

## 设计哲学
- 简洁、专业、高可读性
- 零摩擦：无广告、无需注册、一键搜索

## 截止时间
今晚 12 点前 MVP 上线

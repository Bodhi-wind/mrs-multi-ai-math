# Campaign knowledge writeback

流水线与综合报告会写入：

```text
knowledge/campaigns/<problem-slug>/
  checklist.json          # 四要件状态（旗舰题）
  RUNLOG.md
  results/*.md            # 各角色产出
  runs/*_synthesis.md     # 综合报告
```

这些文件可被 git 提交，从而让 Arena.ai Agent 下次打开仓库时续上进度。

**注意：** 数值上界工具的结果若写入，必须保留 `numerical_upper_bound` 免责声明，不得改为定理表述。

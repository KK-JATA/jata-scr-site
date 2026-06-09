# JATA 独立站开发准则

## Git 安全（红线）

- **禁止** `git checkout HEAD -- <file>` 或 `git checkout -- <file>` 覆盖未提交改动
- **禁止** `git reset --hard`、`git clean -f`、`git push --force`
- **改代码前先 `git commit`** 当前状态。哪怕提交信息写 `wip` 也行
- **回滚用 `git revert`**，不用 `git reset`
- **不用 `bash sed -i` 改文件**——一旦删错无法撤销

## 修改范围

- 用户说改哪就改哪，不改别的地方
- 不确定时先问
- 不在用户没要求时 push、deploy、提交

## 图片操作

- 复制图片用 `cp`，不移动原文件
- 不改其他 section 的图片引用

## 开发流程

- 改完等用户看效果确认再继续
- 用户说"回滚"时只回滚当前改动，不碰其他文件

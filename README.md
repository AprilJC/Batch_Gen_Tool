# 批量图片生成工具

上传一批图片，写一句提示词，一键批量生成 AI 改图效果。

---

## 第一步：安装 Node.js（只需做一次）

Node.js 是运行这个工具所需的基础环境。

1. 打开浏览器，访问 [https://nodejs.org](https://nodejs.org)
2. 点击页面上绿色的 **LTS** 按钮下载安装包
3. 下载完成后双击安装，一路点「继续」「安装」即可

安装完成后，可以验证一下是否成功：
- **Mac**：打开「终端」（在启动台搜索"终端"）
- **Windows**：按 `Win + R`，输入 `cmd`，回车

在弹出的黑色窗口里输入以下内容并回车：

```
node --version
```

如果显示类似 `v20.x.x` 的字样，说明安装成功。

---

## 第二步：安装工具依赖（只需做一次）

打开终端（Mac）或命令提示符（Windows），进入工具所在的文件夹。

**Mac 用户：**
```
cd 把文件夹拖进来这里会自动填入路径
```
> 小技巧：在终端里输入 `cd `（注意后面有个空格），然后把文件夹直接拖到终端窗口里，路径会自动填入，再按回车。

**Windows 用户：**
> 打开文件夹，在地址栏输入 `cmd` 回车，会自动在当前目录打开命令提示符。

进入文件夹后，依次执行：

```
corepack enable
pnpm install
```

（`corepack enable` 让系统启用 pnpm；如果系统提示权限，`sudo corepack enable`）

依赖装好后，复制 `packages/server/.env.example` 为 `packages/server/.env` 并填入你的密钥。

---

## 第三步：启动工具

每次使用前，在工具文件夹的终端里输入：

```
pnpm run dev
```

看到类似下面的提示，说明启动成功：

```
➜  Local:   http://localhost:5173/
```

---

## 第四步：打开页面使用

在浏览器（Chrome、Safari 均可）地址栏输入：

```
http://localhost:5173
```

回车，即可看到操作界面。

---

## 怎么用

1. **选择模型**：下拉菜单有 4 个选项（见下方说明）
2. **写提示词**：在 PROMPT 框里描述你想要的效果，例如："将图片转为水彩画风格"
3. **上传图片**：点击「Select Images」选择单张或多张图片，或点「Select Folder」上传整个文件夹（最多 10 张，每张不超过 10MB）
4. **开始生成**：点击「⚡ Generate All」按钮
5. **下载结果**：生成完成后点「⬇ Download All」下载全部，或点单张图片上的按钮单独下载

---

## 模型选项

下拉菜单中的 4 个模型：
- **nanobanana 2 (vertex)** / **nanobanana pro (vertex)**: 走内部 NewAPI 代理（原有通路）。
- **nanobanana 2 (zhipu)** / **nanobanana pro (zhipu)**: 直连智谱 z.ai 官方 API（需单独配置 `ZHIPU_API_KEY`）。

ratio 与 quality 可在 Zhipu 模型下自由调节；NewAPI 也会透传给上游。Pro 模型只支持 10 种比例（不含 1:4/4:1/1:8/8:1）。

---

## 关闭工具

在终端里按 `Ctrl + C`（Mac 和 Windows 都一样）即可停止。

---

## 常见问题

**页面打不开？**
确认终端里的 `pnpm run dev` 仍在运行，没有被关掉。

**生成失败？**
检查网络连接是否正常，提示词不能为空。

**图片没出来只有报错？**
单张图片大小不能超过 10MB，格式需为 JPG、PNG、WebP 或 GIF。

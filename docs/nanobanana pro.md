模型计费
计费以实际输入输出计算。
Model id
价格（ kToken）

Nano Banana Pro
（gemini-3-pro-image-preview）

输入价格
$0.002

输出价格
$0.012（文字和思考）
$0.12（图片）
图像生成任务
接口请求
传输方式
https
请求地址
https://api.z.ai/api/paas/v4/images/generations
调用方式
同步调用，需通过查询接口获取结果
字符编码
UTF-8
接口请求格式
JSON
响应格式
JSON
接口请求类型
POST
请求参数
文生图
参数名称
类型
是否必填
参数说明
model
string
必填
本次请求使用模型的 Model ID：gemini-3-pro-image-preview
prompt
string
必填
图像编辑指令，用来描述生成图像中期望包含的元素和视觉特点。
quality

string
非必填
生成图像质量。枚举值：
- 1K（默认）
- 2K
- 4K
  您必须使用大写“K”（例如，1K、2K、4K）。小写参数（例如，1k）将被拒绝。
  ratio

string

非必填

生成图像高宽比。枚举值：
- 1:1（默认）
- 2:3
- 3:2
- 4:3
- 3:4
- 4:5
- 5:4
- 16:9
- 9:16
- 21:9
  图文生图
  参数名称
  类型
  是否必填
  参数说明
  model
  string
  必填
  本次请求使用模型的 Model ID：gemini-3-pro-image-preview
  prompt
  string
  必填
  图像编辑指令，用来描述生成图像中期望包含的元素和视觉特点。
  quality

string
非必填
生成图像质量。枚举值：
- 1K（默认）
- 2K
- 4K
  您必须使用大写“K”（例如，1K、2K、4K）。小写参数（例如，1k）将被拒绝。
  ratio

string
非必填
生成图像高宽比。枚举值：
- 1:1（默认）
- 2:3
- 3:2
- 4:3
- 3:4
- 4:5
- 5:4
- 16:9
- 9:16
- 21:9
  images

List
必填
输入的图片url或base64。
gemini-3-pro-image-preview支持传入14张图像。
url
String
必填
图片地址或者base64编码。
响应参数
参数名称
类型
参数说明
created
integer
请求创建时间，是以秒为单位的Unix时间戳
data
object
数组，包含生成的图片URL。
url
String
图片内容的 Base64 编码。请及时转存图片。
usage
object
请求消耗的Token信息，包括总消耗和输入输出明细。
total_tokens
integer
本次请求消耗的总Token数，包括输入和输出。
input_tokens
integer
输入消耗的Token数。
input_tokens_details
object
输入Token的详细分类信息。
text_tokens
integer
输入文本消耗的Token数。
image_tokens
integer
输入图片消耗的Token数。
output_tokens_details
integer
输出消耗的Token数。
text_tokens
integer
输出文字类的tokens消耗，包括文本+思考的tokens。
image_tokens
integer
输出图片消耗的Token数。
调用示例
文生图
curl --location --request POST 'https://api.z.ai/api/paas/v4/images/generations' \
--header 'Authorization: apikey' \
--header 'Content-Type: application/json' \
--data-raw '{
"model": "gemini-3-pro-image-preview",
"prompt": "杰作级画质，超写实。一位精致的东方美女，有着无瑕的肌肤和黑色的长发，她正优雅地斜倚在一张铺着丝绸床单的大床上。清晨的柔和光线透过窗户洒进来，营造出温暖的氛围。焦点清晰，景深效果，电影感光效。",
"quality": "2K",
"ratio": "4:3"
}'
单图生图
curl --location --request POST 'https://api.z.ai/api/paas/v4/images/generations' \
--header 'Authorization: apikey' \
--header 'Content-Type: application/json' \
--data-raw '{
"model": "gemini-3-pro-image-preview",
"prompt": "延伸图片内容，真实、4k、写实，高质量",
"quality": "1K",
"images": ["https://cdn.bigmodel.cn/platform-temporary-file-476da814-7ff4-49af-84ef-34a8639a4663-%E8%AE%BE%E8%AE%A1%E6%81%90%E6%80%96%E7%9F%B3%E5%83%8F%E6%80%AA.png"],
"ratio": "16:9"
}'
多图生图
curl --location --request POST 'https://api.z.ai/api/paas/v4/images/generations' \
--header 'Authorization: apikey' \
--header 'Content-Type: application/json' \
--data-raw '{
"model": "gemini-3-pro-image-preview",
"prompt": "拼接图片内容",
"quality": "1K",
"images": ["https://cdn.bigmodel.cn/platform-temporary-file-faf2e797-2c0b-45a4-966a-c88831d0c582-%E4%BE%A0%E5%AE%A2-2.jpeg","https://cdn.bigmodel.cn/platform-temporary-file-8cb9486e-9d4a-4152-873d-c4c30b54aa0b-%E4%BE%A0%E5%AE%A2-3.jpeg"],
"ratio": "16:9"
}'
响应示例
{
"created": 1765542404,
"data": [
{
"url": "<base64>"
}
],
"usage": {
"input_tokens": 71,
"input_tokens_details": {
"image_tokens": 0,
"text_tokens": 71
},
"output_tokens": 1439,
"output_tokens_details": {
"image_tokens": 1120,
"text_tokens": 319
},
"total_tokens": 1510
}
}

输入价格计算=71*输入单价
输出价格计算=319*输出文本的单价+1120*10*输出文本的单价
输出文件单价 12美元/百万token
输出图片单价 120美元/百万token

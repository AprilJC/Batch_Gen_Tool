模型计费
计费以实际输入输出计算。
Model id
价格（ kToken）

Nano Banana 2
（gemini-3.1-flash-image-preview）

输入价格
$0.0005

输出价格
$0.003（文字和思考）
$0.06（图片）
图像生成同步任务
接口请求
传输方式
https
请求地址
https://router.z.ai/api/v1/images/generations
调用方式
同步调用
字符编码
UTF-8
接口请求格式
JSON
响应格式
JSON
接口请求类型
POST
请求参数
平台-参数名称
类型
是否必填
参数说明
model
String
必填
模型ID，google/gemini-3.1-flash-image-preview
prompt
String
必填
非空字符串，用于详细描述生成的内容。
ratio

String

非必填
生成图像高宽比。枚举值：
- 1:1
- 2:3
- 3:2
- 4:3
- 3:4
- 4:5
- 5:4
- 16:9
- 9:16
- 21:9
- 1:4
- 4:1
- 1:8
- 8:1
  quality
  String

非必填
生成图像质量。枚举值：
- 1K（默认）
- 2K
- 4K
- 0.5K    512  （3.18号更新）
  您必须使用大写“K”（例如，1K、2K、4K）。小写参数（例如，1k）将被拒绝。
  images

List Object
非必填

参考图像数组。

url
String
非必填
图片地址或者base64编码。
响应参数
参数名称
类型
参数说明
id
String
平台生成的任务订单号，调用请求结果接口时请使用此订单号
request_id
String
标识此次请求的唯一ID，可由用户在客户端请求时提交或平台自动生成
created
String
请求创建时间，是以秒为单位的Unix时间戳
data
object
数组，包含生成的图片URL。
url
String
图片内容的 URL 或 Base64 编码。
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
请求示例
curl --location 'https://router.z.ai/api/v1/images/generations' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer your_api_key' \
--data '{
"model": "google/gemini-3.1-flash-image-preview",
"prompt": "延伸图片内容，真实、1k、写实，高质量",
"quality": "1K",
"images": [
{
"url": "https://cdn.bigmodel.cn/platform-temporary-file-476da814-7ff4-49af-84ef-34a8639a4663-%E8%AE%BE%E8%AE%A1%E6%81%90%E6%80%96%E7%9F%B3%E5%83%8F%E6%80%AA.png"
}
],
"ratio": "16:9"
}'
响应示例
{
"created": 1769771128,
"data": [
{
"url": "/9j/4AAQSkZJRg"
}
],
"usage": {
"input_tokens": 3,
"input_tokens_details": {
"image_tokens": 0,
"text_tokens": 3
},
"output_tokens": 1319,
"output_tokens_details": {
"image_tokens": 1120,
"text_tokens": 199
},
"total_tokens": 1405
},
"id": "202601301905098346c548544c48c6",
"request_id": "202601301905098346c548544c48c6"
}
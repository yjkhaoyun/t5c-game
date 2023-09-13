# 使用官方Node.js镜像作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 将package.json和package-lock.json复制到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 安装 pm2
RUN npm install pm2 -g

# 复制所有文件到工作目录
COPY . .

# 构建前端和后端
RUN npm run client-build
RUN npm run server-build

# 运行容器时执行的命令。使用 pm2 启动两个服务。
CMD pm2 start npm --name server -- run server-start && pm2 start npm --name client -- run client-start && pm2 logs
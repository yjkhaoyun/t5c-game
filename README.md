
# 构建本地镜像(确保电脑打了了开始菜单中的docker服务)
    docker build -t game .
# 查看镜像id
 docker images
# 对镜像进行标签重命名
    docker tag 192519a4c32e registry.cn-hangzhou.aliyuncs.com/yjkhaoyun/min-game:1.0
# 将镜像推送到个人阿里云命名空间
    docker push registry.cn-hangzhou.aliyuncs.com/yjkhaoyun/min-game:1.0
# 在centOS中拉取镜像
    docker pull registry.cn-hangzhou.aliyuncs.com/yjkhaoyun/min-game:1.0

# 运行容器
    docker run -d -p 3200:8080 --name mingame -e TZ=Asia/Shanghai registry.cn-hangzhou.aliyuncs.com/yjkhaoyun/min-game:1.0 


# T5C - The 5th Continent
Building a basic multiplayer 3d top down rpg using babylon.js and colyseus

## Current progress:
- fully player authorative movement with client side prediction and server reconciliation
- Simple scene management & switching
- multiplayer animated characters
- zoning system (ability to teleport to a different room (eg: a dungeon for example) )
- global chat (works accross zones)
- server controlled collisions (via a navmesh)
- persistence with mysql lite
- 4 abilities ( basic attack, fireball, dot, heal )
- patrolling monsters (with basic FSM states: IDLE, PATROL, CHASE, ATTACK, DEAD)
- selecting characters and monsters
- monsters have a loot table and can drop items
- ability to pick up items and see them in your inventory
- standard UI (experience bar, abilities bar, panels, etc...)
- and more... 

## Roadmap
You can follow the progress here: [FORUM POST](https://forum.babylonjs.com/t/multiplayer-top-down-rpg-babylon-js-colyseus/35733)

## Requirements
- Download and install [Node.js LTS](https://nodejs.org/en/download/)
- Clone or download this repository.
- Run `yarn install`

## Technology
- Babylon.js 6.x.x (3d rendering engine)
- Colyseus 0.15.x (networking)
- SQLite (database)

## How to run client
- Run `yarn client-dev`

## How to run server
- Run `yarn server-dev`

The client should be accessible at [`http://localhost:8080`](http://localhost:8080).
The WebSocket server should be available locally at `ws://localhost:3000`, and [http://localhost:3000](http://localhost:3000) should be accessible.

## Load testing
- Run `npx tsx ./loadtest/test.ts --room game_room --numClients 1 --endpoint ws://localhost:3000`

## License
Everything under ./src is licensed under the GNU license except for the yuka library who is MIT license.
All models under the ./public/races/models folder does not fall under the GNU license and cannot be used commercially.

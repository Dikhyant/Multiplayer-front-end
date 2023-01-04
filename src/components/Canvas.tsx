import * as Three from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import React from "react";

import "../styles/Canvas.css";
import { CustomWebSocket } from "../network/WebSocket";
import { EMessageCode, EMoveDirection, IMessage, IMessageFromServerToClientPositionSync, IMessageFromServerToClientUserRemoval, IMessageFromServerToClientUserSpawn, IMessageToServer, IUserData, IUserSyncData } from "../interfaces/NetworkInterfaces";
import { User } from "../utils/User";

export class Canvas extends React.Component {
    canvas: React.RefObject<HTMLCanvasElement>;

    constructor(props: any){
        super(props);
        console.log("canvas constructor");
        this.canvas = React.createRef();
        
        this.allUsers = new Map<string, User>();
        this.setUpScene();
        this.initializePlayerCharacter();
        CustomWebSocket.initialize();
        CustomWebSocket.attachMessageListner(this.handleOnMessage.bind(this));
        

        document.addEventListener("keydown", (event: KeyboardEvent)=>{
            let message: IMessageToServer;
            if(event.key === "w") {
                message = {
                    moveDirection: EMoveDirection.FORWARD
                }
                CustomWebSocket.sendMessage(JSON.stringify(message));
                return;
            } 

            if(event.key === "s") {
                message = {
                    moveDirection: EMoveDirection.BACKWARD
                }
                CustomWebSocket.sendMessage(JSON.stringify(message));
                return;
            }

            if(event.key === "d") {
                message = {
                    moveDirection: EMoveDirection.RIGHT
                }
                CustomWebSocket.sendMessage(JSON.stringify(message));
                return;
            }

            if(event.key === "a") {
                message = {
                    moveDirection: EMoveDirection.LEFT
                }
                CustomWebSocket.sendMessage(JSON.stringify(message));
                return;
            }
        })
    }

    render(): React.ReactNode {
        
        return (
            <div>
                <canvas id="main-canvas" ref={this.canvas}>

                </canvas>
            </div>
        )
    }

    componentDidMount(): void {
        this.setUpRenderer();
    }

    initializePlayerCharacter(){
        const geometry = new Three.BoxGeometry(1, 1, 1);
        const material = new Three.MeshStandardMaterial({color: "#ffffff"});
        this.currentUser = new User(new Three.Mesh(geometry, material));

        const bodyMesh = this.currentUser.getBodyMesh();
        bodyMesh.position.set(0, 0, 0);
        if(this.mainScene === null || this.mainScene === undefined) return;
        this.mainScene.add(bodyMesh);
    }

    setUpScene(){
        this.mainScene = new Three.Scene();
    }

    setUpRenderer(){
        if(this.mainScene === null || this.mainScene === undefined) return;

        const mainRenderer = new Three.WebGL1Renderer({
            canvas: this.canvas.current as HTMLCanvasElement,
            antialias: false
        });
        const mainCamera = new Three.PerspectiveCamera(50, 
            (this.canvas.current as HTMLCanvasElement).clientWidth / (this.canvas.current as HTMLCanvasElement).clientHeight,
            0.1,
            1000
            );

        mainCamera.position.set(0, 0, -9);

        const ambientLight = new Three.AmbientLight(0xffffff);
        this.mainScene.add(ambientLight);

        const directionalLight = new Three.DirectionalLight(0xffffff, 1);
        this.mainScene.add(directionalLight);

        const size = 10;
        const divisions = 10;

        const gridHelper = new Three.GridHelper( size, divisions );
        this.mainScene.add( gridHelper );

        if(this.canvas === null || this.canvas === undefined) return;
        const controls = new OrbitControls(mainCamera, this.canvas.current as HTMLCanvasElement);

        const animationLoop = () =>{
            if(this.mainScene === null || this.mainScene === undefined) return;

            controls.update();
            mainRenderer.render(this.mainScene, mainCamera);
        }

        mainRenderer.setAnimationLoop(animationLoop);
    }

    handleOnMessage(event: MessageEvent<any>){
        const data: IMessage = JSON.parse(event.data);
        if(data.code === EMessageCode.SPAWN) {
            this.handleSpawnMessageFromServer(event);
            return;
        }

        if(data.code === EMessageCode.SELF_SPAWN) {
            this.handleSelfSpawn(event);
            return;
        }

        if(data.code === EMessageCode.MOVEMENT) {
            this.handleUserMovement(event);
            return;
        }

        if(data.code === EMessageCode.USER_REMOVAL) {
            this.handleUserRemoval(event);
            return;
        }

    }

    handleSelfSpawn(event: MessageEvent<any>) {
        const data: IMessageFromServerToClientUserSpawn = JSON.parse(event.data);
        const userInfo: IUserData[] = data.users;
        if(userInfo === null || userInfo === undefined) return;
        if(this.currentUser === null || this.currentUser === undefined) return;
        
        this.currentUser.uid = userInfo[0].uid;
        this.allUsers.set(this.currentUser.uid, this.currentUser);
        const bodyMesh = this.currentUser.getBodyMesh();
        bodyMesh.material = new Three.MeshStandardMaterial({color: userInfo[0].skinColor});
        bodyMesh.position.set(
            userInfo[0].transform.position.x,
            userInfo[0].transform.position.y,
            userInfo[0].transform.position.z
        )
    }

    handleUserMovement(event: MessageEvent<any>) {
        const data: IMessageFromServerToClientPositionSync = JSON.parse(event.data);
        const usersInfo: IUserSyncData[] = data.users;
        if(usersInfo === null || usersInfo === undefined) return;

        for(let i = 0; i < usersInfo.length; i++) {
            const user:User = this.allUsers.get(usersInfo[i].uid) as User;
            if(user === null || user === undefined) continue;

            const bodyMesh = user.getBodyMesh();
            bodyMesh.position.set(
                usersInfo[i].transform.position.x,
                usersInfo[i].transform.position.y,
                usersInfo[i].transform.position.z,
            );

            bodyMesh.rotation.set(
                usersInfo[i].transform.eulerRotation.x,
                usersInfo[i].transform.eulerRotation.y,
                usersInfo[i].transform.eulerRotation.z,
            )
        }
    }

    handleSpawnMessageFromServer(event: MessageEvent<any>){
        const data: IMessageFromServerToClientUserSpawn = JSON.parse(event.data);
        const usersInfo: IUserData[] = data.users;
        if(usersInfo === null || usersInfo === undefined) return;
        if(this.mainScene === null || this.mainScene === undefined) return;

        for(let i = 0; i < usersInfo.length; i++) {
            const geometry = new Three.BoxGeometry(1, 1, 1);
            const material = new Three.MeshStandardMaterial({color: usersInfo[i].skinColor});
            const user: User = new User(new Three.Mesh(geometry, material));
            this.allUsers.set(usersInfo[i].uid, user);
            user.uid = usersInfo[i].uid;
            const bodyMesh = user.getBodyMesh();
            bodyMesh.position.set(
                usersInfo[i].transform.position.x,
                usersInfo[i].transform.position.y,
                usersInfo[i].transform.position.z
            )
            this.mainScene.add(bodyMesh);
            
        }
    }

    handleUserRemoval(event: MessageEvent<any>) {
        const data: IMessageFromServerToClientUserRemoval = JSON.parse(event.data);
        const uids: string[] = data.uids;
        if(uids === null || uids === undefined) return;
        if(this.mainScene === null || this.mainScene === undefined) return;

        let user: User;
        for(let i = 0; i < uids.length; i++) {
            user = this.allUsers.get(uids[i]) as User;
            if(user === null || user === undefined) continue;

            this.mainScene.remove(user.getBodyMesh());
            this.allUsers.delete(user.uid);
        }
    }

    private currentUser: User | undefined;
    private allUsers: Map<string, User>;
    private playerMesh: Three.Mesh<Three.BufferGeometry, Three.Material> | undefined;
    private mainScene: Three.Scene | undefined;
}
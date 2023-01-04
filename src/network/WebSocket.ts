import { webSocketURl } from "./NetworkProperties";

export class CustomWebSocket {
    private constructor(){
        
    }

    public static initialize(){
        if(this.instance == null || this.instance == undefined) {
            this.instance = new CustomWebSocket();
            this.instance.webSocket = new WebSocket(webSocketURl);
        }
    }

    public static getInstance(): CustomWebSocket{
        if(this.instance == null || this.instance == undefined) {
            CustomWebSocket.initialize();
        }

        return this.instance as CustomWebSocket;
    }

    public static sendMessage(message: string){
        if(this.instance == null || this.instance == undefined) return;
        if(this.instance.webSocket == null || this.instance.webSocket == undefined) return;

        this.instance.webSocket.send(message);
    }

    public static attachMessageListner(callback: (event: MessageEvent<any>)=>any){
        if(this.instance == null || this.instance == undefined) return;
        if(this.instance.webSocket == null || this.instance.webSocket == undefined) return;

        this.instance.webSocket.onmessage = callback;
    }

    private static instance: CustomWebSocket | undefined;
    private webSocket: WebSocket | undefined;
}


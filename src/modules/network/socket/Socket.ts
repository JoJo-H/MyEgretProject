

class Socket {
    private _needReconnect:boolean = false;
    private _maxReconnectCount = 10;

    private _reconnectCount:number = 0;
    private _connectFlag:boolean
    private _isConnecting:boolean;

    private _host:string;
    private _port:any;
    private _socket:egret.WebSocket;
    private _msg:BaseMsg;
    public constructor() {
    }

    private static _instance : Socket;
    public static getInstance():Socket {
        if(!this._instance) {
            this._instance = new Socket();
        }
        return this._instance;
    }

    /**
     * 初始化服务区地址
     * @param host IP
     * @param port 端口
     * @param msg 消息发送接受处理类
     */
    public initServer(host:string, port:any, msg:BaseMsg):void {
        this._host = host;
        this._port = port;
        this._msg = msg;
    }

    /**
     * 开始Socket连接
     */
    public connect():void {
        if (egret.Capabilities.runtimeType == egret.RuntimeType.WEB) {
            if (!window["WebSocket"]) {
                console.log("不支持WebSocket");
                return;
            }
        }
        this._socket = new egret.WebSocket();
        if (this._msg instanceof ByteArrayMsg) {
            this._socket.type = egret.WebSocket.TYPE_BINARY;
        }
        console.log("start connect WebSocket: " + this._host + ":" + this._port);
        this.addEvents();
        this._socket.connect(this._host, this._port);
    }

    /**
     * 重新连接
     */
    private reconnect():void {
        this.closeCurrentSocket();
        this._reconnectCount++;
        if (this._reconnectCount < this._maxReconnectCount) {
            this.connect();
        } else {
            this._reconnectCount = 0;
            if (this._connectFlag) {
                GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_CLOSE);
            } else {
                GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_NOCONNECT);
            }
        }
    }

    /**
     * 发送消息到服务器
     * @param msg
     */
    public send(msg:any):void {
        this._msg.send(this._socket, msg);
    }

    /**
     * 关闭Socket连接
     */
    public close():void {
        this._connectFlag = false;
        this.closeCurrentSocket();
    }

    /**
     * 清理当前的Socket连接
     */
    private closeCurrentSocket(){
        this.removeEvents();
        this._socket.close();
        this._socket = null;
        this._isConnecting = false;
    }

    /**
     * Socket是否在连接中
     * @returns {boolean}
     */
    public isConnecting():boolean {
        return this._isConnecting;
    }

    /**
     * Debug信息
     * @param str
     */
    private debugInfo(str:String):void {
        GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_DEBUG_INFO, str);
    }

    /**
     * 添加事件监听
     */
    private addEvents() {
        this._socket.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.onReceiveMessage, this);
        this._socket.addEventListener(egret.Event.CONNECT, this.onSocketOpen, this);
        this._socket.addEventListener(egret.Event.CLOSE, this.onSocketClose, this);
        this._socket.addEventListener(egret.IOErrorEvent.IO_ERROR, this.onSocketError, this);
    }

    /**
     * 移除事件监听
     */
    private removeEvents():void {
        this._socket.removeEventListener(egret.ProgressEvent.SOCKET_DATA, this.onReceiveMessage, this);
        this._socket.removeEventListener(egret.Event.CONNECT, this.onSocketOpen, this);
        this._socket.removeEventListener(egret.Event.CLOSE, this.onSocketClose, this);
        this._socket.removeEventListener(egret.IOErrorEvent.IO_ERROR, this.onSocketError, this);
    }

        /**
     * 服务器连接成功
     */
    private onSocketOpen(e:egret.Event):void {
        this._reconnectCount = 0;
        this._isConnecting = true;

        if (this._connectFlag && this._needReconnect) {
            GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_RECONNECT);
        } else {
            GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_CONNECT);
        }

        this._connectFlag = true;
    }

    /**
     * 服务器断开连接
     */
    private onSocketClose(e:egret.Event):void {
        this._isConnecting = false;

        if (this._needReconnect) {
            GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_START_RECONNECT);
            this.reconnect();
        } else {
            GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_CLOSE);
        }
    }

    /**
     * 服务器连接错误
     */
    private onSocketError(e:egret.IOErrorEvent):void {
        if (this._needReconnect) {
            this.reconnect();
        } else {
            GlobalAPI.facede.sendNotification(SocketMediator.SOCKET_NOCONNECT);
        }
        this._isConnecting = false;
    }

    /**
     * 收到服务器消息
     * @param e
     */
    private onReceiveMessage(e:egret.ProgressEvent):void {
        this._msg.receive(this._socket);
    }
}
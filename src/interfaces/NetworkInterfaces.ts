export interface ITransform{
    position: IVector3,
    eulerRotation: IVector3 
}

export interface IVector3 {
    x: number,
    y: number,
    z: number
}

export enum EMoveDirection{
    FORWARD,
    BACKWARD,
    LEFT,
    RIGHT,
    STAY
}

export interface IMessageToServer{
    moveDirection: EMoveDirection
}

export interface IUserData {
    transform: ITransform,
    skinColor: string,
    uid: string
}

export interface IMessageFromServerToClientUserSpawn extends IMessage {
    users: IUserData[]
}

export interface IMessageFromServerToClientUserRemoval extends IMessage {
    uids: string[]
}

export interface IUserSyncData {
    uid: string,
    transform: ITransform
}

export interface IMessageFromServerToClientPositionSync extends IMessage {
    users: IUserSyncData[]
}

export interface IMessage {
    code: EMessageCode
}

export enum EMessageCode {
    SELF_SPAWN,
    SPAWN,
    MOVEMENT,
    USER_REMOVAL
}
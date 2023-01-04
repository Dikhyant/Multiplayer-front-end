import {Mesh} from "three";
export class User {
    constructor(mesh: Mesh) {
        this.bodyMesh = mesh;
        this.uid = "";
    }

    getBodyMesh():Mesh {
        return this.bodyMesh;
    }
    private bodyMesh: Mesh;
    public uid : string; 
}
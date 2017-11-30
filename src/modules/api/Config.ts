
class Config {

    private _configMap : Map<string,any> = new Map();
    private static _instance : Config;
    static getInstance():Config {
        if(!this._instance) {
            this._instance = new Config();
        }
        return this._instance;
    }

    getConfig<T>(name:string,key:string,defaultValue:T):T{
        if( !this._configMap.has(name) ) {
            var data = RES.getRes(name);
            if(data) {
                this._configMap.set(name,data);
            }
        }
        if(key == null) {
            return this._configMap.get(name) || defaultValue;
        }

        var ret = defaultValue;
        if(this._configMap.has(name)) {
            if (key != null) {
                ret = obj.getValue(this._configMap.get(name), key, defaultValue);
            }
        }
        return ret;
    }

    exists(name:string, key:string):boolean {
        if (!this._configMap.has(name)) {
            var data = RES.getRes(name);
            if (data) {
                this._configMap.set(name,data);
            }
        }
        if (this._configMap.has(name)) {
            if (obj.hasValue(this._configMap[name], key)) {
                return true;
            }
        }
        return false;
    }

    static get(name:string,key:string=null,defaultValue:any = null):any{
        return Config.getInstance().getConfig(name,key,defaultValue);
    }

    static exists(name:string, key:string):boolean {
        return Config.getInstance().exists(name, key);
    }



    private _zip : JSZip ;
    loadZip():void {
        if(this._zip) return;
        RES.getResByUrl("resource/assets/config/json.zip",(data)=>{
            //解压数据
            this._zip = new JSZip(data);
            //读取数据
            // var json = this._zip.file('errorcode.json').asText();
            // console.log(JSON.parse(json));
        },this,RES.ResourceItem.TYPE_BIN);
    }

    static loadZip():any{
        return Config.getInstance().loadZip();
    }

    //name格式 xxx_json
    getJson(name:string):any {
        if(!this._zip) {
            this.loadZip();
        }
        if(this._configMap.has(name)) {
            return this._configMap.get(name);
        }
        var fileName = name.split('_').join('.');
        var json = this._zip.file(fileName);
        if(json) {
            this._configMap.set(name,JSON.parse(json.asText()));
        }else {
            var data = RES.getRes(name);
            if (data) {
                this._configMap.set(name,data);
            }
        }
        return this._configMap.get(name);
    }
}
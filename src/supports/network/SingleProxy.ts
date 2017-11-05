
class SingleProxy extends BaseProxy{

    private _info : ProxyInfo;
    constructor(info:ProxyInfo){
        var parm = network.proxyInfo2Param(info);
        super(parm);
        this._info = info;
    }

    load():void {
        var delayObj : any = this.getParamByName('delay');
        if(delayObj) {
            var time = delayObj['time'];
            var type = delayObj['type'] || '';
            var key = this._info.moddo;
            if(type) {
                key += '.'+type;
            }
            if(ProxyTime.getInstance().getLeftime(key) == 0) {
                ProxyTime.getInstance().push(key,time);
                super.load();
            }else {
                this.dispatchEvent(new ProxyEvent(ProxyEvent.RESPONSE_SUCCEED,this));
            }
        }else {
            super.load();
        }
    };
}
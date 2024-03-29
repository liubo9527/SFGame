import VMParent  from "../modelView/VMParent";
import { BehaviorTerminalNode, BehaviorRunningStatus ,BehaviorNodePrecondition, BehaviorNode, BehaviorNodeFactory, BehaviorNodeSequence, BehaviorNodePreconditionNOT, BehaviorNodePreconditionTRUE
       } from "../aiBehaviorTree/BehaviorTree";

//import "../aiBehaviorTree/BehaviorTree.ts"
// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html


const {ccclass, property} = cc._decorator;
@ccclass
export default class Cat extends VMParent {

    data = {
        word:"喵...",
    };
    private _animationName = null;
    set animationName(animationName: string){ if(this._animationName!=animationName){this._animationName = animationName,this.display.playAnimation(this._animationName, 0)}};
    get animationName(){return this._animationName};
    private _moveSpeed = null;
    set moveSpeed(moveSpeed: number){this._moveSpeed = moveSpeed};
    get moveSpeed(){return this._moveSpeed};
    private _behaviorRootNode = null;
    set behaviorRootNode (behaviorRootNode:BehaviorNode){this._behaviorRootNode = behaviorRootNode};
    get behaviorRootNode(){return this._behaviorRootNode};
    private _param:Cat_Parameter = null;
    set param (param:Cat_Parameter){this._param = param};
    get param(){return this._param};
    private _face = 1;
    set face(face){this._face = face, this.display.node.scaleX = this._face};
    get face(){return this._face};

    setSkinColor(color){
        this.display.node.color = color;
    }

    @property(dragonBones.ArmatureDisplay)
    // LIFE-CYCLE CALLBACKS:
    display:dragonBones.ArmatureDisplay = null;

    @property([dragonBones.ArmatureDisplay])
    skill1Arry:dragonBones.ArmatureDisplay[] = [];

    // onLoad () {
    //     super.onLoad();
    // }

    start () {
        var root = BehaviorNodeFactory.createPriorityBehaviorNode(null, "root");
        var attack = BehaviorNodeFactory.createTerminalBehaviorNode(Cat_attack, root, "attack");
        attack.behaviorNodePrecondition = new CON_skillPrecondition();
        var priority = BehaviorNodeFactory.createPriorityBehaviorNode(root, "sequence");
        priority.behaviorNodePrecondition = new BehaviorNodePreconditionNOT(new CON_hasReachTarget);
        var turnFace = BehaviorNodeFactory.createTerminalBehaviorNode(Cat_turnFace, priority, "turnFace");
        turnFace.behaviorNodePrecondition = new BehaviorNodePreconditionNOT(new CON_hsaSameDirection());
        var move = BehaviorNodeFactory.createTerminalBehaviorNode(Cat_move, priority,"move");
        move.behaviorNodePrecondition = new BehaviorNodePreconditionTRUE(); 
        var idle = BehaviorNodeFactory.createTerminalBehaviorNode(Cat_idle, root, "idle");
        idle.behaviorNodePrecondition = new BehaviorNodePreconditionTRUE();
        this.behaviorRootNode = root;

        this.param = new Cat_Parameter();
        this.param.inputParameter = new Cat_InputParameter();
        this.param.inputParameter.owner = this;
        this.param.inputParameter.targetPos = new  cc.Vec2(0, 0);
        this.param.inputParameter.owner.moveSpeed = 1;
        this.param.inputParameter.timeStep = 1;
    } 

    update (dt) {
        if(this.behaviorRootNode.evaluate(this.param.inputParameter)){
            this.behaviorRootNode.tick(this.param.inputParameter);
        }
    }

    catSkill1(index){
        var skillDisPlay = this.skill1Arry[index]
        skillDisPlay.node.x = this.face * (parseInt(index)+1) * 100;
        skillDisPlay.playAnimation("pao", 1)
    }
}

class Cat_InputParameter{
    //目的地址
    private _targetPos = null;
    set targetPos (pos: cc.Vec2) {this._targetPos = pos;}
    get targetPos () {return this._targetPos;}
    //owner
    private _owner = null;
    get owner () { return this._owner; }
    set owner (owner: Cat) { this._owner = owner; }
    //speed
    private _timeStep = null;
    get timeStep () { return this._timeStep; }
    set timeStep (timeStep:number){ this._timeStep = timeStep;}
    //skill
    private _skillData = [];
    get skillData () { return this._skillData};
    set skillData (skillData:any){ this._skillData = skillData};

}

class Cat_OutputParameter {
    private _animationName = null;
    set animationName(animationName: string){ this._animationName = animationName};
    get animationName(){ return this._animationName};

}

class Cat_Parameter{
    private _inputParameter = null;
    set inputParameter (inputParameter:Cat_InputParameter){this._inputParameter = inputParameter};
    get inputParameter(){return this._inputParameter;}
    private _outputParameter = null;
    set outputparameter (outputParameter:Cat_OutputParameter){this._outputParameter = outputParameter};
    get outputparameter(){return this._outputParameter;}
}

class Cat_idle extends BehaviorTerminalNode{
    _doExecute(input:Cat_InputParameter):BehaviorRunningStatus{
        input.owner.animationName = "steady";
        input.owner.data.word = "待机";
        return BehaviorRunningStatus.k_BRS_Finish;
    }
}

class Cat_move extends BehaviorTerminalNode{
    _doExecute(input:Cat_InputParameter):BehaviorRunningStatus{
        input.owner.animationName = "run";
        var targetPos = input.targetPos;
        var currentPos = new cc.Vec2(input.owner.node.x, input.owner.node.y);
        var subPos = targetPos.sub(currentPos);
        var unitVec2 = subPos.normalize();
        input.owner.node.x += unitVec2.x * input.owner.moveSpeed;
        input.owner.node.y += unitVec2.y * input.owner.moveSpeed;
        if(subPos.mag() < input.owner.moveSpeed){
            input.owner.data.word = "移动完毕";
            return BehaviorRunningStatus.k_BRS_Finish;
        }else{
            input.owner.data.word = "移动中";
            return BehaviorRunningStatus.k_BRS_Executing;
        }
    }
}

class CON_hasReachTarget extends BehaviorNodePrecondition{
    externalCondition(input:Cat_InputParameter):boolean{
        var targetPos = input.targetPos;
        var currentPos = new cc.Vec2(input.owner.node.x, input.owner.node.y);
        if(currentPos.sub(targetPos).mag() < input.owner.moveSpeed){
            return true;
        }else{
            return false;
        }
    }
}

class Cat_turnFace extends BehaviorTerminalNode{
    private _timecount = 20;
    _doEnter(behaviorInputParam){
        this._timecount = 20;
    }
    _doExecute(input:Cat_InputParameter):BehaviorRunningStatus{
       this._timecount -= input.timeStep;
       input.owner.animationName = "steady"
       if(this._timecount <= 0){
            input.owner.face *=  -1;
            input.owner.data.word = "转身完毕";
            return BehaviorRunningStatus.k_BRS_Finish;
       }else{
            input.owner.data.word = "转身中";
            return BehaviorRunningStatus.k_BRS_Executing;
       }
    }
}

class CON_hsaSameDirection extends BehaviorNodePrecondition{
    externalCondition(input:Cat_InputParameter):boolean{
        var sub = input.targetPos.x - input.owner.node.x;
        if(sub * input.owner.face> 0){
            return true;
        }else{
            return false;
        }
    }
}

class Cat_attack extends BehaviorTerminalNode{
    private _timecount = 40;//抬手动作时间
    _doExecute(input:Cat_InputParameter):BehaviorRunningStatus{
        this._timecount -= input.timeStep;
        input.owner.animationName = "skillAttack1"
        if(this._timecount <= 0){
            input.owner.data.word = "影压";
            let element = input.skillData.shift();
            input.owner.catSkill1(element)
            return BehaviorRunningStatus.k_BRS_Finish;
       }else{
            input.owner.data.word = "影压抬手";
            return BehaviorRunningStatus.k_BRS_Executing;
       }
    }
    _doExit(behaviorInputParam){
        this._timecount = 40;
    }
}

class CON_skillPrecondition extends BehaviorNodePrecondition{
    externalCondition(input:Cat_InputParameter):boolean{
        if(input.skillData && input.skillData.length > 0){
            return true;
        }else{
            return false;
        }
    }
}
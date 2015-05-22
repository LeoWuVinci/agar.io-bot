/*
Advance Tactics
1. Using viruses to trap players
2. Shoot at viruses to break large blobs
   */

var Action=function(type,x,y,myOrganism,otherOrganism){
	this.type=type
	this.x=x
	this.y=y
	this.myOrganism=myOrganism
	this.otherOrganism=otherOrganism
}
Action.prototype={
	type:'', //move,split,shoot
	x:0,
	y:0,
	myOrganism:null,
	otherOrganism:null,
	calcImportance:function(considerations){
		totalWeightedScore=0
		scores=[]

		for(var i=0;i<considerations.length;i++){
			if(considerations[i].isActive(this.myOrganism,this.otherOrganism,this)){//TODO use Array.filter instead	
				var score=considerations[i].normalizedCalc(this.myOrganism,this.otherOrganism,this)
				scores.push(score)
				totalWeightedScore+=score*considerations[i].weight
			} //FIXME Since considerations can be disabled, weighted average is needed
		}
		return [totalWeightedScore,scores] //TODO Not sure I like this return hmm
	}
}

var Consideration=function(label,isActive,calc,weight,color){
	this.isActive=isActive; //TODO Change to filter?
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.calc=calc;	
}

Consideration.prototype={
	weight:1,
	label:'',
	color:'', //TODO MD5 the label to generate a unique color
	get value(){
		return ~~this.weight;
   	},
	calc:function(myOrganism,otherOrganism,action){},
	min:Number.MAX_VALUE,
	max:Number.MIN_VALUE,
	normalizedCalc:function(myOrganism,otherOrganism,action){
		var value=this.calc(myOrganism,otherOrganism,action)
		if(value<this.min){this.min=value}
		if(value>this.max){this.max=value}
		return (value-this.min)/(this.max-this.min)
	},	
}

var Bot=function(move,split,shoot){
	BotInterface.call(this,move,split,shoot)
}

Bot.prototype=Object.create(BotInterface.prototype)
//size = radius
//score=size*size/100
BotPrototype={
	expectedSplitCount:0,
	onDeath:function(){},
	onTick:function(){},
	considerations:[
		new Consideration(
			"Size Difference",
			function(){return true},
			function(myOrganism,otherOrganism,action){
				if(otherOrganism.isVirus){
					return (myOrganism.size-otherOrganism.size)	
				}else{
					return -Math.abs(myOrganism.size-otherOrganism.size)
				}
			},
			1,
			'#FF5A5E'	
		),
		new Consideration(
			"Nearest Target",
			function(){return true},
			function(myOrganism,otherOrganism,action){
				if(!otherOrganism.isVirus&&myOrganism.size>otherOrganism.size){
					return -(Math.pow(Math.pow(myOrganism.px-action.x,2)+Math.pow(myOrganism.py-action.y,2),.5)-myOrganism.size-otherOrganism.size)
				}else{
					return Math.pow(Math.pow(myOrganism.px-action.x,2)+Math.pow(myOrganism.py-action.y,2),.5)-myOrganism.size-otherOrganism.size
				}
			},
			1,
			'#46BFBD'
		),
		new Consideration(
			"Too close for comfort",
			function(){return true},
			function(myOrganism,otherOrganism,action){
				if(myOrganism.size<otherOrganism.size&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)-myOrganism.size-otherOrganism.size<0){
					console.log("dodging ",otherOrganism.name)
					action.x=myOrganism.px*2-otherOrganism.px
					action.y=myOrganism.py*2-otherOrganism.py
				}
				return myOrganism.size<otherOrganism.size&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)-myOrganism.size-otherOrganism.size<0
			},
			10,
			'#EEEEEE'
		),
		new Consideration(
			"Map Edge Avoidance",
			function(){return true},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(Math.pow(5575-otherOrganism.px,2)+Math.pow(5575-otherOrganism.py,2),.5)
			},
			1,
			'#FDB45C'
		),
		new Consideration(
			"Splitter Avoidance",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(otherOrganism.size-myOrganism.size*2) //likelyhood to stay away from splitters
			},
			1,
			'#33EE33'
		),
		/*
		new Consideration(
			"Split based on Size",
			function(myOrganism,otherOrganism,actionType){
				return -(actionType=='split')*((otherOrganism.size-myOrganism.size)/5000+1)
			},
			0,
			'#FF0000'
		),
		new Consideration(
			"Split based on distance",
			function(myOrganism,otherOrganism,actionType){
				var distance=0 //FIXME Find the correct distance
				return -(actionType=='split')*-distance
			},
			0,
			'#FF0000'
		)
		*/
	],
	lastAction:null,
	currentState:'',
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	myOrganisms:[],
	tick:function(organisms,myOrganisms,score){
		var otherOrganisms=organisms.filter(function(organism){
			if(!organism.x2){
				organism.x2=organism.x
				organism.y2=organism.y
			}
			
			/* velocity */
			organism.dx=organism.x-organism.x2
			organism.dy=organism.y-organism.y2

			organism.x2=organism.x
			organism.y2=organism.y

			if(!organism.pdx){
				organism.pdx=organism.dx
				organism.pdy=organism.dy
			}

			/* acceleration */
			organism.dx2=organism.dx-organism.pdx
			organism.dy2=organism.dy-organism.pdy

			organism.pdx=organism.dx
			organism.pdy=organism.dy

			/* predicted coordinates for the next tick */
			organism.px=organism.x+organism.dx+organism.dx2
			organism.py=organism.y+organism.dy+organism.dy2

			return myOrganisms.indexOf(organism)==-1
		})
		this.myOrganisms=myOrganisms

		if(myOrganisms.length>=expectedSplitCount){
			this.expectedSplitCount=0
		}

		var actions=[]
		for(var i=0;i<myOrganisms.length;i++){
			actions.push(this.findBestAction(otherOrganisms,myOrganisms[i],score))
		}
		if (actions.length){
			var myOrganism=myOrganisms[0],
				action=actions[0]
			
			switch(action.type){
				case 'move':
					this.move(action.x,action.y)
				break;
				case 'split':
					this.move(action.x,action.y)
					this.expectedSplitCount=myOrganisms.length*2 //FIXME Doesn't consider half splits
					this.split()
				break;
				case 'shoot':
					this.move(action.x,action.y)
					this.shoot()
				break;	
			}
			
			if(!this.lastAction
				||this.lastAction.otherOrganism.name!=action.otherOrganism.name
			){
				if(action.otherOrganism.isVirus){
					console.log("avoiding virus", action.otherOrganism.name,[action])
				}else if (action.otherOrganism.size>myOrganism.size){
					console.log("avoiding", action.otherOrganism.name,[action])
				}else{
					console.log("chasing", action.otherOrganism.name,[action])
				}
			}
			this.lastAction=action
		}

		if (myOrganisms.length<1){
			if(this.currentState&&this.currentState!='dead'){
				for(var i=0;i<this.considerations.length;i++){
					if(this.scoreHistory>this.gameHistory[this.gameHistory.length-1]){
						this.considerations[i].weight+=Math.round(Math.random()*2)
					}else{
						this.considerations[i].weight+=Math.round(Math.random()*10)	
					}
				}

				this.gameHistory.push([
					this.lastStateChangeDate,
					new Date,	
					this.scoreHistory
				])
				console.log("DEAD x_X")
				console.log("Score",~~(this.scoreHistory[this.scoreHistory.length-1]/100))
				console.log("Time spent alive",(Date.now()-this.lastStateChangeDate.getTime())/60000,"mins")
				this.scoreHistory=[]
				this.lastStateChangeDate=new Date
			}
			this.currentState='dead'
			return
		}else{
			if (this.currentState!='alive'){
				this.lastStateChangeDate=new Date
			}
			this.scoreHistory.push(score)
			this.currentState='alive'
		}

		this.onTick()
	},
	findBestAction:function(otherOrganisms,myOrganism,score){
		var actions=[]
		for(var i=0;i<otherOrganisms.length;i++){
			var organism=otherOrganisms[i],
				action,
				myVelocity=Math.pow(Math.pow(myOrganism.dx,2)+Math.pow(myOrganism.dy,2),.5),
				tickCount=0;

			if (myVelocity){
				tickCount=Math.pow(Math.pow(myOrganism.px-organism.px,2)+Math.pow(myOrganism.py-organism.py,2),.5)/velocity;
			}

			if (organism.isVirus&&organism.size<myOrganism.size
						||!organism.isVirus&&organism.size*.85>myOrganism.size
			){

				//TODO Better interception when target is moving towards bot
				action=new Action(
					'move',
					myOrganism.px*2-(organism.px+tickCount*organism.dx),
					myOrganism.py*2-(organism.py+tickCount*organism.dy),
					myOrganism,
					organism)
			}else if (!organism.isVirus
					&&organism.size<myOrganism.size*.85){
				if (true|| //TODO this needs to be a consideration instead
						organism.size<myOrganism.size*.3
						||organism.size>myOrganism.size*.425
						||myOrganism.size<65
						||myOrganisms.length<this.expectedSplitCount
						||Math.pow(Math.pow(organism.x-myOrganism.x,2)+Math.pow(organism.y-myOrganism.y,2),.5)>myOrganism.size*3
				){
					action=new Action('move',organism.px+tickCount*organism.dx,organism.py+tickCount*organism.dy,myOrganism,organism)
				}else{
					action=new Action('split',organism.px,organism.py,myOrganism,organism) //FIXME
				}
			}

			/* reduce invisible wall drag */
			//Map is I believe 11200x11200
			//TODO Curve away from the wall
			if (action.x+myOrganism.size>11200){
				action.x=11200-myOrganism.size;
				action.y+=action.y-myOrganism.y
			}else if(action.x-myOrganism.size<0){
				action.x=myOrganism.size;
				action.y+=action.y-myOrganism.y
			}
			if (action.y+myOrganism.size>11200){
				action.y=11200-myOrganism.size;
				action.x+=action.x-myOrganism.x
			}else if(action.y-myOrganism.size<0){
				action.y=myOrganism.size;
				action.x+=action.x-myOrganism.x
			}

			actions.push(action)
		}

		actions.sort(function(a,b){
			return b.calcImportance(this.considerations)[0]-a.calcImportance(this.considerations)[0]		
				}.bind(this))

		if (actions.length > 1){
			var imaginaryOrganism={
				x:0,
				y:0,
				px:0,
			  	py:0,
			   	dx:0,
			   	dy:0,
			   	size:0
			}

			//TODO Find the weighted avg based on importance instead of just the avg
			var j=0;
			for(var i=0;i<actions.length;i++){
				if(!actions[i].otherOrganism.isVirus&&myOrganism.size<actions[i].otherOrganism.size) {
					for(key in imaginaryOrganism){
						imaginaryOrganism[key]+=actions[i].otherOrganism[key]
					}
					j++;
					if(j==1){
						break;
					}
				}
			}

			if (!j){
				for(key in imaginaryOrganism){
					imaginaryOrganism[key]/=j+1
				}

				imaginaryOrganism.isVirus=false
				imaginaryOrganism.name="Imaginary Organism"

				actions.push(this.findBestAction([imaginaryOrganism],myOrganism,score))

				actions.sort(function(a,b){
					return b.calcImportance(this.considerations)[0]-a.calcImportance(this.considerations)[0]		
						}.bind(this))
			}
		}
		return actions[0]
	},
	draw:function(ctx){ 
	 	if(this.lastAction){
			for (var i=0;i<this.myOrganisms.length;i++){
				var myOrganism=this.myOrganisms[i]
				ctx.beginPath()
				if(this.lastAction.otherOrganism.isVirus||this.lastAction.otherOrganism.size>myOrganism.size){
					ctx.strokeStyle='red'
				}else{
					ctx.strokeStyle='green'
				}	
				ctx.moveTo(myOrganism.x,myOrganism.y)
				ctx.lineTo(this.lastAction.otherOrganism.x,this.lastAction.otherOrganism.y)
				ctx.stroke()
				
				ctx.beginPath()
				ctx.strokeStyle="black"
				ctx.moveTo(myOrganism.x,myOrganism.y)
				ctx.lineTo(this.lastAction.x,this.lastAction.y)
				ctx.stroke()
			}
		}
	}
}
for(key in BotPrototype){
	Bot.prototype[key]=BotPrototype[key]
}

/*
Advance Tactics
1. Using viruses to trap players
2. Shoot at viruses to break large blobs

//TODO Refactor action code for new possible actions
//TODO Clean up tree traversal code
//TODO Deal with gameHistory possible memory limit issue
//TODO revisit escape path
//TODO revisit "Too close for comfort"
//TODO Jump servers every 4hrs
//TODO Consider 16 piece split has the ability to eat viruses when you have more than 100 mass
//TODO High score

//TODO Consider lost of velocity into calculating best moves
//TODO Consider enemies about to merge
//TODO Split for escape
//TODO Consider random paths at 1200+
//TODO Feeding, Attacking, Escaping phase
//TODO Eat based on direction
//TODO Goto corner when huge
   */

function Stat(startDate,endDate,sizes,considerationWeights){
	this.startDate=startDate
	this.endDate=endDate
	this.sizes=sizes
	this.considerationWeights=considerationWeights
}
Stat.prototype={
	startDate:null,
	endDate:null,
	sizes:[],
	get maxSize(){
		return Math.max.apply(null,this.sizes);
	},
	considerationWeights:[]
}

var Organism=function(){}
Organism.prototype={
	x:0,
	y:0,
	px:0,
	py:0,
	dx:0,
	dy:0,
	size:0,
	isVirus:false
}

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
		var values=considerations
			.filter(function(consideration){return consideration.filter(this.myOrganism,this.otherOrganism,this)},this)
			.map(function(consideration,i,filteredConsiderations){
					return consideration.weightedCalc(this.myOrganism,this.otherOrganism,this)/filteredConsiderations.length},this)

		if(values.length){
			return values.reduce(function(a,b){return a+b})
		}
		return 0
	}
}

var Consideration=function(label,filter,calc,weight,color){
	this.filter=filter;
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
	min:0,
	max:0,
	weightedCalc:function(myOrganism,otherOrganism,action){
		var value=this.calc(myOrganism,otherOrganism,action)
		if(value<this.min){
			this.min=value
		}
		if(value>this.max){
			this.max=value
		}
		return (value-this.min)/(this.max-this.min)*this.weight
	},
}

var ActionGenerator=function(label,filter,calcPriority,weight,color,calcCoord){
	Consideration.call(this,label,filter,calcPriority,weight,color)
	this.calcCoord=calcCoord
}

ActionGenerator.prototype=Object.create(Consideration.prototype)
actionGeneratorPrototype={
	calcCoord:function(myOrganism,otherOrganism){}
}
for(key in actionGeneratorPrototype){
	ActionGenerator.prototype[key]=actionGeneratorPrototype[key]
}

var Ai=function(move,split,shoot){
	AiInterface.call(this,move,split,shoot)

	chrome.storage.local.get("gameHistory",function(items){
		if(items.gameHistory){
		this.gameHistory=items.gameHistory

		var weights=[],
		totalMaxSize=0
		for(var i=0;i<this.considerations.length;i++){
			weights[i]=0
		}

			for(var i=0;i<this.gameHistory.length;i++){
				var stat=this.gameHistory[i],
					totalWeight=stat.considerationWeights.reduce(function(a,b){return a+b})
				for(var j=0;j<stat.considerationWeights.length;j++){
					var maxSize=Math.max.apply(null,stat.sizes);
					if(maxSize!=0&&maxSize!=-Infinity){
						weights[j]=stat.considerationWeights[j]/totalWeight*maxSize
						totalMaxSize+=maxSize
					}
				}
			}

			this.totalWeights=weights
			this.totalMaxSize=totalMaxSize
		}
	}.bind(this))
}

Ai.prototype=Object.create(AiInterface.prototype)
//size = radius
//score=size*size/100
AiPrototype={
	specialNames:{},
	expectedSplitCount:0,
	onTick:function(){},
	totalWeights:[],
	totalMaxSize:0,
	isTeachMode:1,
	considerations:[
		new Consideration(
			"Avoid Virus Attackers",
			function(myOrganism,otherOrganism){return otherOrganism.isVirus},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size	
			},
			1,
			'#FF5A5E'	
		),
		new Consideration(
			"Avoid Enemies With Similar Mass",
			function(myOrganism,otherOrganism){return !otherOrganism.isVirus&&myOrganism.size<otherOrganism.size},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			1,
			'#335A5E'	
		),
		new Consideration(
			"Chase Blob with Similar Mass",
			function(myOrganism,otherOrganism){return !otherOrganism.isVirus&&myOrganism.size>otherOrganism.size},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			2,
			'#AA5A5E'	
		),
		new Consideration(
			"Chase Nearest Small Blob",
			function(myOrganism,otherOrganism){return !otherOrganism.isVirus&&myOrganism.size>otherOrganism.size},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(Math.pow(myOrganism.px-action.x,2)+Math.pow(myOrganism.py-action.y,2),.5)-myOrganism.size
			},
			1,
			'#46BFBD'
		),
		new Consideration(
			"Avoid Nearest Large Blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&myOrganism.size<otherOrganism.size
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.px-myOrganism.px,2)+Math.pow(otherOrganism.py-myOrganism.py,2),.5)+otherOrganism.size
			},
			3,
			'#46BF00'
		),
		new Consideration(
			"Avoid Colliding Larger Blobs",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus
				&&myOrganism.size<otherOrganism.size
			},
			function(myOrganism,otherOrganism,action){
				return -(1/this.computeDistanceFromEdge(myOrganism.px, myOrganism.py, otherOrganism.px, otherOrganism.py, otherOrganism.size))
			},
			3,
			'#EEEEEE'
		),
		new Consideration(
			"Avoid Colliding Viruses",
			function(myOrganism,otherOrganism){
				return otherOrganism.isVirus
					&&myOrganism.size>otherOrganism.size
					&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)<=myOrganism.size+myOrganism.dx+myOrganism.dy //TODO Consider taking out pow(,.5)
			},
			function(myOrganism,otherOrganism,action){
				return true 
			},
			1,
			'rgb(163,73,164)'
		),
		new Consideration(
			"Move towards Middle of Map",
			function(){return true},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(5600-action.x,2)-Math.pow(5600-action.y,2)
			},
			2,
			'#FDB45C'
		),
		new Consideration(
			"Avoid Splitters", 
			function(myOrganism,otherOrganism,action){
				return !otherOrganism.isVirus
					&& otherOrganism.size>63
					&& myOrganism.size*2<otherOrganism.size	
				},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size	
			},
			2,
			'#33EE33'
		),
		new Consideration(
			"Avoid Nearest Virus",
			function(myOrganism,otherOrganism){
				return otherOrganism.isVirus&&myOrganism.size>otherOrganism.size
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.px-myOrganism.px,2)+Math.pow(otherOrganism.py-myOrganism.py,2),.5)+myOrganism.size
			},
			1,
			'#46FF22'
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
	actionGenerators:[
		new ActionGenerator(
			"Intercept small blob",
			function(myOrganism,otherOrganism,specialNames){
				return !otherOrganism.isVirus
					&&otherOrganism.size<myOrganism.size*.85
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')	
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#FF0000',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dx,2)+Math.pow(otherOrganism.dy,2),.5)
				//tells us how long it will take to reach the midpoint	
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('move',
					myOrganism.dx+myOrganism.dx2+otherOrganism.px+otherOrganism.dx*tickCount,
					myOrganism.dy+myOrganism.dy2+otherOrganism.py+otherOrganism.dy*tickCount,
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"Juke big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&otherOrganism.size>myOrganism.size	
			},
			function(myOrganism,otherOrganism){
				return Math.pow(myOrganism.x-otherOrganism.y,2)+Math.pow(myOrganism.y-otherOrganism.y,2)
			},
			1,
			'#00FF00',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dx,2)+Math.pow(otherOrganism.dy,2),.5)
				//tells us how long it will take to reach the midpoint	
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('move',
					(myOrganism.px+myOrganism.dx+myOrganism.dx2)*2-otherOrganism.px-otherOrganism.dx*tickCount,
					(myOrganism.py+myOrganism.dy+myOrganism.dy2)*2-otherOrganism.py-otherOrganism.dy*tickCount,
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"B line away big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&otherOrganism.size>myOrganism.size	
			},
			function(myOrganism,otherOrganism){
				return -Math.pow(myOrganism.x-otherOrganism.y,2)-Math.pow(myOrganism.y-otherOrganism.y,2)
			},
			1,
			'#0000FF',
			function(myOrganism,otherOrganism){
				return new Action('move',
					(myOrganism.px+myOrganism.dx+myOrganism.dx2)*2-otherOrganism.px-otherOrganism.dx-otherOrganism.dx2,
					(myOrganism.py+myOrganism.dy+myOrganism.dy2)*2-otherOrganism.py-otherOrganism.dy-otherOrganism.dy2,
					myOrganism,
					otherOrganism)	
			}
		),
		new ActionGenerator(
			"B line away from virus",
			function(myOrganism,otherOrganism){
				return otherOrganism.isVirus&&otherOrganism.size<myOrganism.size	
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#0000FF',
			function(myOrganism,otherOrganism){
				return new Action('move',
					(myOrganism.px+myOrganism.dx+myOrganism.dx2)*2-otherOrganism.px,
					(myOrganism.py+myOrganism.dy+myOrganism.dy2)*2-otherOrganism.py,
					myOrganism,
					otherOrganism)	
			}
		)
	],
	lastAction:null,
	currentState:'',
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	myOrganisms:[],
	otherOrganisms:[],
	computeDistance:function(x1, y1, x2, y2){
		var xdis = x1 - x2;
		var ydis = y1 - y2;
		return Math.sqrt(Math.pow(xdis, 2) + Math.pow(ydis, 2));
	}
	computeDistanceFromEdge:function(x1, y1, x2, y2, s2){
		var distance = this.computeDistance(x2, y2, x1, y1);
		var ratioX = distance / (x2 - x1);
		var ratioY = distance / (y2 - y1);
		var offsetX = x2 - ( s2 / ratioX );
		var offsetY = y2 - ( s2 / ratioY );
		return this.computeDistance(x1, y1, offsetX, offsetY);
	}
	simulateAction:function(otherOrganisms,myOrganisms,action){
		var clonedKeys=['x','y','px','py','dx','dy','size','name','isVirus'],
			clonedOtherOrganisms=otherOrganisms.map(function(organism){
				var clone={}
				for(var i=0;i<clonedKeys.length;i++){
					clone[clonedKeys[i]]=organism[clonedKeys[i]]//TODO move organisms	
				}
				return clone	
			}),
			clonedMyOrganisms=myOrganisms.map(function(organism){
				var clone={}
				for(var i=0;i<clonedKeys.length;i++){
					clone[clonedKeys[i]]=organism[clonedKeys[i]]	
				}
				return clone	
			})

		for(var i=0;i<clonedMyOrganisms.length;i++){
			clonedMyOrganisms[i].x=action.x
			clonedMyOrganisms[i].y=action.y

			clonedMyOrganisms[i].px=action.x
			clonedMyOrganisms[i].py=action.y
		}

		clonedOtherOrganisms=clonedOtherOrganisms.filter(function(organism){
			return clonedMyOrganisms[0].x!=organism.px||clonedMyOrganisms[0].y!=organism.py
		})
		return {
			otherOrganisms:clonedOtherOrganisms,
			myOrganisms:clonedMyOrganisms
		}
	},
	tick:function(organisms,myOrganisms,score){
		var otherOrganisms=this.otherOrganisms=organisms.filter(function(organism){
			if(!organism.x2){
				organism.x2=organism.nx
				organism.y2=organism.ny

				if(this.specialNames[organism.name]){
					this.onFoundSpecialName(organism.name)
				}
			}
			
			/* velocity */
			organism.dx=organism.nx-organism.x2
			organism.dy=organism.ny-organism.y2

			organism.x2=organism.nx
			organism.y2=organism.ny

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
			organism.px=organism.nx+organism.dx+organism.dx2
			organism.py=organism.ny+organism.dy+organism.dy2

			return myOrganisms.indexOf(organism)==-1
		},this)

		if(myOrganisms.length>=this.expectedSplitCount){
			this.expectedSplitCount=0
		}

		if (myOrganisms.length){
			var action=this.findBestAction(otherOrganisms,myOrganisms,0)
			
			if (action){
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
						console.info("avoiding virus", action.otherOrganism.name,[action])
					}else if (action.otherOrganism.size>myOrganisms[0].size){
						console.info("avoiding", action.otherOrganism.name,[action])
					}else{
						console.info("chasing", action.otherOrganism.name,[action])
					}
				}
				this.lastAction=action
			}

			if (this.currentState!='alive'){
				this.lastStateChangeDate=new Date
			}
			this.scoreHistory.push(score)
			this.currentState='alive'
		}else{
			if(this.currentState=='alive'){
				this.gameHistory.push(new Stat(
						this.lastStateChangeDate,
						new Date,	
						this.scoreHistory,
						this.considerations.map(function(consideration){return consideration.weight})))


				var slicedGameHistory=this.gameHistory.slice(this.gameHistory.length-400,this.gameHistory.length)
				chrome.storage.local.set({gameHistory:slicedGameHistory}) //TODO Learning is capped at 400 due to chrome's freezing when trying to save more than that

				var weights=this.totalWeights,
					totalMaxSize=this.totalMaxSize

				for(var i=this.gameHistory.length-1;i<this.gameHistory.length;i++){
					var stat=this.gameHistory[i],
						totalWeight=stat.considerationWeights.reduce(function(a,b){return a+b})
					for(var j=0;j<stat.considerationWeights.length;j++){
						var maxSize=Math.max.apply(null,stat.sizes);
						weights[j]=stat.considerationWeights[j]/totalWeight*maxSize
						totalMaxSize+=maxSize	
					}
				}

				this.totalWeights=weights
				this.totalMaxSize=totalMaxSize
			
				if(!this.isTeachMode){	
					for(var i=0;i<weights.length;i++){
						weights[i]/=totalMaxSize;
						weights[i]=Math.pow(weights[i],10000000);
						weights[i]+=Math.random()*100/(this.gameHistory.length%2?1:this.gameHistory.length)+1
						this.considerations[i].weight=weights[i]	
					}
				}
				
				heatMapCtx.strokeStyle="#FF0000"
				heatMapCtx.strokeRect((this.lastAction.x-this.lastAction.myOrganism.size)/64,(this.lastAction.y-this.lastAction.myOrganism.size)/64,this.lastAction.myOrganism.size*2/64,this.lastAction.myOrganism.size*2/64)	
				console.info("DEAD x_X")
				console.info("Score",~~(this.scoreHistory[this.scoreHistory.length-1]/100))
				console.info("Time spent alive",(Date.now()-this.lastStateChangeDate.getTime())/60000,"mins")
				this.scoreHistory=[]
				this.lastStateChangeDate=new Date
			}
			this.currentState='dead'
		}

		this.onTick()
	},
	findBestAction:function(otherOrganisms,myOrganisms,depth){ //TODO To handle splits i need to be able to add multiple organisms to this function
		var actions=[],
			myOrganism=myOrganisms[0]
	
		for(var i=0;i<otherOrganisms.length;i++){
			var organism=otherOrganisms[i],
				actionGenerators=this.actionGenerators
					.filter(function(actionGenerator){return actionGenerator.filter(myOrganism,organism,this.specialNames)},this),
				action
				
			if(actionGenerators.length){
				action=actionGenerators.reduce(function(a,b){
					if(a.weightedCalc(myOrganism,organism)>b.weightedCalc(myOrganism,organism)){
						return a		
					}
					return b
				}).calcCoord(myOrganism,organism)
			}

			/* reduce invisible wall drag */
			//Map is I believe 11200x11200
			//TODO Curve away from the wall
			if(action){
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
		}

		if (actions.length > 1){
			var totalImportance=0,
				organism=new Organism,
				virus=new Organism,
				srcActions=[]
			for(var i=0;i<actions.length;i++){
				var action=actions[i]
				if(action.otherOrganism.isVirus
					&&myOrganism.size>action.otherOrganism.size
					||!action.otherOrganism.isVirus
					&&myOrganism.size<action.otherOrganism.size
				){
					srcActions.push(action)
					var importance=action.calcImportance(this.considerations)
					totalImportance+=importance
					for(key in Organism.prototype){
						organism[key]+=action.otherOrganism[key]*importance
					}
				}
			}
			
			for(key in Organism.prototype){
				organism[key]/=totalImportance
			}

			for(key in Organism.prototype){
				virus[key]=organism[key]
			}
			organism.name="Worst route"
			virus.name="Worst virus route"
			virus.isVirus=true
			virus.dx=0
			virus.dy=0
			organism.dx=0
			organism.dy=0

			var bestOrganismAction=this.findBestAction([organism],myOrganisms)
			var bestVirusAction=this.findBestAction([virus],myOrganisms)
			if(bestOrganismAction){
				bestOrganismAction.srcActions=srcActions
				actions.push(bestOrganismAction)
			}
		
			if(bestVirusAction){	
				bestVirusAction.srcActions=srcActions
				actions.push(bestVirusAction)
			}
		}
		
		actions.sort(function(a,b){
			return b.calcImportance(this.considerations)-a.calcImportance(this.considerations)	
		}.bind(this))

		if(depth){
			for(var i=0;i<actions.length;i++){
				var action=actions[i]
				var results=this.simulateAction(otherOrganisms,myOrganisms,actions[i])
				action.next=this.findBestAction(results.otherOrganisms,results.myOrganisms,depth-1)
			}

			actions.sort(function(a,b){
				var aTotal=0,
					bTotal=0,
					c=a,
					d=b

				while(c){
					aTotal+=c.calcImportance(this.considerations)
					c=c.next
				}

				while(d){
					bTotal+=d.calcImportance(this.considerations)
					d=d.next
				}

				return bTotal-aTotal		
			}.bind(this))
		}

		return actions[0]
	},
	draw:function(ctx){
		var lastAction=this.lastAction
			miniMapCtx.clearRect(0,0,175,175)
			
			for(var i=0;i<this.otherOrganisms.length;i++){
				var otherOrganism=this.otherOrganisms[i]
				miniMapCtx.strokeStyle="#4444FF"
				miniMapCtx.strokeRect((otherOrganism.x-otherOrganism.size)/64,(otherOrganism.y-otherOrganism.size)/64,otherOrganism.size*2/64,otherOrganism.size*2/64)
			}

		if (lastAction){
			miniMapCtx.strokeStyle="#FFFFFF"
			miniMapCtx.strokeRect((this.lastAction.myOrganism.x-this.lastAction.myOrganism.size)/64,(this.lastAction.myOrganism.y-this.lastAction.myOrganism.size)/64,this.lastAction.myOrganism.size*2/64,this.lastAction.myOrganism.size*2/64)
		}

		if(true||this.gameHistory.length%2){
			while(lastAction){
						//for (var i=0;i<this.lastAction.myOrganisms.length;i++){ //TODO Only one myOrganism?
					var myOrganism=lastAction.myOrganism
					ctx.beginPath()
					ctx.lineWidth=4
					if(lastAction.otherOrganism.isVirus||lastAction.otherOrganism.size>myOrganism.size){
						ctx.strokeStyle='#FF0000'
					}else{
						ctx.strokeStyle='#00FF00'
					}	
					ctx.moveTo(myOrganism.x,myOrganism.y)
					ctx.lineTo(lastAction.otherOrganism.x,lastAction.otherOrganism.y)
					ctx.stroke()
				
					ctx.lineWidth=2	
					ctx.beginPath()
					ctx.strokeStyle="#FFFFFF"
					ctx.moveTo(myOrganism.x,myOrganism.y)
					ctx.lineTo(lastAction.x,lastAction.y)
					ctx.stroke()

					if(lastAction.srcActions){
						ctx.lineWidth=1	
						ctx.strokeStyle='#FF0000'
						for(var i=0;i<lastAction.srcActions.length;i++){
							ctx.beginPath()
							ctx.moveTo(lastAction.otherOrganism.x,lastAction.otherOrganism.y)
							ctx.lineTo(lastAction.srcActions[i].otherOrganism.x,lastAction.srcActions[i].otherOrganism.y)
							ctx.stroke()
						}
					}
				//}
				lastAction=lastAction.next
			}
		}
	}
}
for(key in AiPrototype){
	Ai.prototype[key]=AiPrototype[key]
}

//TODO Become sentient.








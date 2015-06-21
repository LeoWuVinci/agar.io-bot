"use strict";
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

//TODO does feeding cell keep two from combining?

//TODO Consider lost of velocity into calculating best moves
//TODO Consider enemies about to merge
//TODO Split for escape
//TODO Consider random paths at 1200+
//TODO Feeding, Attacking, Escaping phase
//TODO Eat based on direction
//TODO Goto corner when huge
   */

//TODO Cache action generators
//TODO Change how actions are prioritized
//TODO Double the cushion 

function Stat(startDate,endDate,scores,considerationWeights){
	this.startDate=startDate
	this.endDate=endDate
	this.scores=scores
	this.considerationWeights=considerationWeights
}
Stat.prototype={
	startDate:null,
	endDate:null,
	scores:[],
	get maxScore(){
		return Math.max.apply(null,this.scores);
	},
	considerationWeights:[],
	lastActionOtherOrganismSize:0,
	lastActionOtherOrganismDist:0,
	lastActionOtherOrganismPv:0,
	lastActionMyOrganismPv:0,
	lastActionMyOrganismSize:0,
	cushion:0,
	ping:0,
	avgPing:0
}

function Organism(){}
Organism.prototype={
	nx:0,
	ny:0,
	dx:0,
	dy:0,
	v:0,
	cushion:0,
	size:0,
	isVirus:false
}

function Action(type,x,y,myOrganism,otherOrganism){
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
	weightedValues:[],
	calcImportance:function(considerations){
		var filteredConsiderations=considerations
			.filter(function(consideration){return consideration.weight&&consideration.filter(this.myOrganism,this.otherOrganism,this)},this)
		
		if(filteredConsiderations.length){
			this.weightedValues=filteredConsiderations.map(function(consideration){
				return [consideration.weightedCalc(this.myOrganism,this.otherOrganism,this),consideration]
			},this).sort(function(a,b){
				return b[0]-a[0]
			})

			return this.weightedValues[0][0]/filteredConsiderations.map(function(consideration){return consideration.weight}).reduce(function(a,b){return a+b})
		}
		return 0
	}
}

function Consideration(label,filter,calc,delay){
	this.filter=filter;
	this.label=label;
	this.calc=calc;
	this.delay=delay;
	this.weightedCalcCache={}
}

Consideration.prototype={
	delay:1,
	weight:1,
	label:'',
	get value(){
		return ~~this.weight;
   	},
	calc:function(myOrganism,otherOrganism,action){},
	min:0,
	max:0,
	weightedCalc:function(myOrganism,otherOrganism,action,clearCache){
		if(
			action&&ai.scoreHistory.length%this.delay&&this.weightedCalcCache[otherOrganism.id+action.type]&&!clearCache
	  	){
			return this.weightedCalcCache[otherOrganism.id+action.type]
		}else if (
			ai.scoreHistory.length%this.delay&&this.weightedCalcCache[otherOrganism.id]&&!clearCache
		){
			return this.weightedCalcCache[otherOrganism.id]
		}else{
			if(Math.random()>.9999){
				this.weightedCalcCache={}
			}
			var value=this.calc(myOrganism,otherOrganism,action)
			this.min=value<this.min?value:this.min
			this.max=value>this.max?value:this.max
			var weightedValue=(value-this.min)/(this.max-this.min)*this.weight
			if(action){
				this.weightedCalcCache[otherOrganism.id+action.type]=weightedValue
			}else{
				this.weightedCalcCache[otherOrganism.id]=weightedValue
			}
			return weightedValue
		}
	},
	get color(){
		return '#'+md5(this.label).substr(0,6)
	},
	draw:function(ctx,myOrganism,otherOrganism){
		ctx.beginPath()
		ctx.arc(
			otherOrganism.nx,
			otherOrganism.ny,
			~~Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.5),
			0,
			2*Math.PI)
		ctx.stroke()
	}
}

function ActionGenerator(label,filter,calcPriority,genAction,delay){
	Consideration.call(this,label,filter,calcPriority,delay)
	this.genAction=genAction
}

ActionGenerator.prototype=Object.create(Consideration.prototype)
var actionGeneratorPrototype={
	genAction:function(myOrganism,otherOrganism){}
}
for(var key in actionGeneratorPrototype){
	ActionGenerator.prototype[key]=actionGeneratorPrototype[key]
}

function Ai(move,split,shoot){
	AiInterface.call(this,move,split,shoot)

	chrome.storage.local.get("gameHistory",function(items){
		if(items.gameHistory){
			var weights=[]
			for(var i=0;i<this.considerations.length;i++){
				weights[i]=0
			}

			for(var i=0;i<items.gameHistory.length;i++){
				var stat=items.gameHistory[i],
					totalWeight=stat.considerationWeights.reduce(function(a,b){return a+b}),
					maxScore=Math.max.apply(null,stat.scores)
				if(maxScore!=-Infinity){
					for(var j=0;j<stat.considerationWeights.length;j++){
						var weightedScore=Math.pow(2,Math.pow(maxScore,.5)-100)
						this.totalWeightedScore+=weightedScore
						weights[j]+=stat.considerationWeights[j]/totalWeight*weightedScore
					}
					this.gameHistory.push(stat)
				}
			}

			this.totalWeights=weights
		}
	}.bind(this))
}

Ai.prototype=Object.create(AiInterface.prototype)
//size = radius
//score=size*size/100
var AiPrototype={
	totalWeightedScore:0,
	cushions:[],
	pings:[],
	splitCooldown:10000,
	depth:3,
	onDraw:function(){},
	specialNames:{},
	onTick:function(){},
	totalWeights:[],
	isTeachMode:false,
	lastActionBest5:[],
	cushion:0,
	heatmapEnabled:false,
	considerations:[
		new Consideration(
			"Avoid Virus Attackers",
			function(myOrganism,otherOrganism,action){
				return otherOrganism.isVirus
					&&action.type=='move'
					&&otherOrganism.size<myOrganism.size*.85
					&&Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.5)<660
				},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size
			},
			100
		),
		new Consideration(
			"Avoid Blob w/ Slightly Larger Mass",
			function(myOrganism,otherOrganism,action){
				return !otherOrganism.isVirus
					&&myOrganism.size<otherOrganism.size*.85
					&&action.type=='move'
			},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			25
		),
		new Consideration(
			"Chase Blob w/ Slightly Smaller Mass",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus&&myOrganism.size*.85>otherOrganism.size&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			50
		),
		new Consideration(
			"Chase Nearest Smaller Blob",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus&&myOrganism.size*.85>otherOrganism.size&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.2)
			},
			100
		),
		new Consideration(
			"Avoid Nearest Larger Blob",
			function(myOrganism,otherOrganism,action){
				return !otherOrganism.isVirus
				&&myOrganism.size<otherOrganism.size*.85
				&&action.type=='move'
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.1)
			},
			25
		),
		new Consideration(
			"Avoid Colliding into Virus",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
					&&otherOrganism.isVirus
					&&myOrganism.size*.85>otherOrganism.size
					&&Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)<=myOrganism.size+myOrganism.cushion
			},
			function(myOrganism,otherOrganism,action){
				return true
			},
			100
		),
		new Consideration(
			"Chase Smaller Blobs near Edge",
			function(myOrganism,otherOrganism,action){
				return myOrganism.size*.85>otherOrganism.size
					&&!otherOrganism.isVirus
					&&otherOrganism.v
					&&action.type=='move'
			},
			function(myOrganism,otherOrganism,action){
				return Math.pow(5600-otherOrganism.nx,2)+Math.pow(5600-otherOrganism.ny,2)
			},
			50
		),
		new Consideration(
			"Avoid Bigger Blobs near Edge",
			function(myOrganism,otherOrganism,action){
				return myOrganism.size<otherOrganism.size*.85
					&&!otherOrganism.isVirus
					&&action.type=='move'
			},
			function(myOrganism,otherOrganism,action){
				return Math.pow(5600-otherOrganism.nx,2)+Math.pow(5600-otherOrganism.ny,2)
			},
			25
		),
		
		new Consideration(
			"Avoid Splitters",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
					&&!otherOrganism.isVirus
					&& otherOrganism.size>63
					&& myOrganism.size<otherOrganism.size*.425
				},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size
			},
			25
		),
		new Consideration(
			"Avoid Nearest Virus",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
					&&otherOrganism.isVirus
					&&myOrganism.size*.85>otherOrganism.size
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.1)
			},
			100
		),
		new Consideration(
			"Split on smaller blob",
			function(myOrganism,otherOrganism,action){
				return action.type=='split'&&myOrganism.size*.425>otherOrganism.size	
			},
			function(myOrganism,otherOrganism,action){
				return otherOrganism.size-myOrganism.size
			},
			50
		),
		new Consideration(
			'Split on farther blob',
			function(myOrganism,otherOrganism,action){
				return action.type=='split'&&myOrganism.size*.425>otherOrganism.size	
			},
			function(myOrganism,otherOrganism,action){
				return Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2)
			}
		),
		new Consideration(
			"Split to escape",
			function(myOrganism,otherOrganism,action){
				return action.type=='split'
				&&!otherOrganism.isVirus
				&&otherOrganism.name!="Best route"
				&&myOrganism.size<otherOrganism.size*.85
				&&Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)
					<=otherOrganism.size+(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)/3},
			function(myOrganism,otherOrganism,action){ //Compares with dodging or just moving away
				return true
			}
		),
		new Consideration(
			"Shoot to flee faster",
			function(myOrganism,otherOrganism,action){
				var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)

				return action.type=='shoot'
				&&otherOrganism.name!="Best route"
				&&myOrganism.size<otherOrganism.size*.85
				&&dist>otherOrganism.size+(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)/3
				&&dist<=otherOrganism.size+(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)*2/3
				},
			function(myOrganism,otherOrganism,action){ //Compares with dodging or just moving away
				return true
			}
		),
		new Consideration(
			"Shoot to bait",
			function(myOrganism,otherOrganism,action){
				return action.type=='shoot'
					&&myOrganism.size*.85>otherOrganism.size
			},
			function(){
				return true
			},
			25
		)
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
				return -Ai.prototype.myOrganisms.length
			},
			function(myOrganism,otherOrganism){
				var tickCount=otherOrganism.v?Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v:0
				return new Action('move',
					otherOrganism.nx+otherOrganism.dx*tickCount,
					otherOrganism.ny+otherOrganism.dy*tickCount,
					myOrganism,
					otherOrganism)
			},
			100
		),
		new ActionGenerator(
			"Juke big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&otherOrganism.size*.85>myOrganism.size&&otherOrganism.v
			},
			function(myOrganism,otherOrganism){
				return Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)
			},
			function(myOrganism,otherOrganism){
				var tickCount=otherOrganism.v?Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v:0
				return new Action('move',
					myOrganism.nx*2-otherOrganism.nx-otherOrganism.v*tickCount,
					myOrganism.ny*2-otherOrganism.ny-otherOrganism.v*tickCount,
					myOrganism,
					otherOrganism)
			},
			25
		),
		new ActionGenerator(
			"B line away from big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&otherOrganism.size*.85>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return -Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)
			},
			function(myOrganism,otherOrganism){
				return new Action('move',
					myOrganism.nx*2-otherOrganism.nx,
					myOrganism.ny*2-otherOrganism.ny,
					myOrganism,
					otherOrganism)
			},
			25
		),
		new ActionGenerator(
			"B line away from virus",
			function(myOrganism,otherOrganism){
				return otherOrganism.isVirus&&otherOrganism.size<myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			function(myOrganism,otherOrganism){
				return new Action('move',
					myOrganism.nx*2-otherOrganism.nx,
					myOrganism.ny*2-otherOrganism.ny,
					myOrganism,
					otherOrganism)
			},
			75
		),
		new ActionGenerator(
			"Split small blob",
			function(myOrganism,otherOrganism,specialNames){
				var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5),
					ftrDist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx-otherOrganism.dx,2)+Math.pow(myOrganism.ny-otherOrganism.ny-otherOrganism.dy,2),.5)

				return !otherOrganism.isVirus
					&&otherOrganism.v
					&&otherOrganism.size>48
					&&otherOrganism.size<myOrganism.size*.425
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')
					&&dist<ftrDist
					&&dist<550-myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v
				//FIXME What is split velocity?	
				return new Action('split',
					otherOrganism.nx+otherOrganism.dx*tickCount,
					otherOrganism.ny+otherOrganism.dy*tickCount,
					myOrganism,
					otherOrganism)
			},
			25
		),
		new ActionGenerator( //TODO Consider splitting perpendicular if it's a split attack
			"Split b-line away from big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus
					&&myOrganism.size>64
					&&otherOrganism.size*.85>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			function(myOrganism,otherOrganism){
				return new Action('split',
					myOrganism.nx*2-otherOrganism.nx,
					myOrganism.ny*2-otherOrganism.ny,
					myOrganism,
					otherOrganism)
			},
			25
		),
		new ActionGenerator(
			"Shoot to flee",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus
					&&myOrganism.size>64
					&&otherOrganism.size*.85>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			function(myOrganism,otherOrganism){
				return new Action('shoot',
					myOrganism.nx*2-otherOrganism.nx,
					myOrganism.ny*2-otherOrganism.ny,
					myOrganism,
					otherOrganism)
			},
			25
		),
		new ActionGenerator(
			"Shoot to bait",
			function(myOrganism,otherOrganism,specialNames){
				var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5),
					ftrDist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx-otherOrganism.dx,2)+Math.pow(myOrganism.ny-otherOrganism.ny-otherOrganism.dy,2),.5)

				return !otherOrganism.isVirus
					&&otherOrganism.v
					&&otherOrganism.size>48
					&&otherOrganism.size<myOrganism.size*.425
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')
					&&dist<ftrDist
					&&dist<750-myOrganism.size
					&&dist>650-myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v
				return new Action('shoot',
					otherOrganism.nx-otherOrganism.dx*tickCount,
					otherOrganism.ny-otherOrganism.dy*tickCount,
					myOrganism,
					otherOrganism)
			},
			25
		)
	],
	linesEnabled:true,
	lastAction:null,
	currentState:'',
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	myOrganisms:[],
	otherOrganisms:[],
	allowSplit:true,
	allowShoot:true,
	shootCooldown:5000,
	onDeath:function(){},
	myRing:['rgba(255,255,255,.95)',10,'rgba(53,255,255,.3)',20],
	badRing:['rgba(255,255,255,1)',4, 'rgba(231,76,60,.3)',20],
	goodRing:['rgba(255,255,255,.95)',2, 'rgba(12,227,172,.3)',10],
	otherRing:['rgba(255,255,255,.9)',1, 'rgba(12,227,172,.1)',2],
	simulateAction:function(myOrganism,otherOrganisms,action){
		var tickCount=myOrganism.v?Math.pow(Math.pow(action.x-myOrganism.nx,2)+Math.pow(action.y-myOrganism.ny,2),.5)/myOrganism.v:0,
			clonedMyOrganism=new Organism
		
		Object.keys(myOrganism).forEach(function(key){clonedMyOrganism[key]=myOrganism[key]})
		clonedMyOrganism.nx=action.x
		clonedMyOrganism.ny=action.y

		return {
			myOrganism:clonedMyOrganism,
			otherOrganisms:otherOrganisms
				.filter(function(a){return a.id!=action.otherOrganism.id})
				.map(function(organism){
					var clone=new Organism
					Object.keys(organism).forEach(function(key){clone[key]=organism[key]})
					clone.id=organism.id
					clone.nx+=clone.dx*tickCount
					clone.ny+=clone.dy*tickCount
					return clone
				})
		}
	},
	tick:function(organisms,myOrganisms,score){
		Ai.prototype.myOrganisms=myOrganisms //TODO Find a better way to organize this
		if(myOrganisms.length){
			var otherOrganisms=this.otherOrganisms=organisms.filter(function(organism){
					organism.nx=organism.D
					organism.ny=organism.F
					if(!organism.onx){
						organism.onx=organism.nx
						organism.ony=organism.ny
					}

					organism.dx=organism.nx-organism.onx
					organism.dy=organism.ny-organism.ony
					organism.v=Math.pow(Math.pow(organism.dx,2)+Math.pow(organism.dy,2),.5)
					organism.cushion=organism.v*this.avgPing/40

					organism.onx=organism.nx
					organism.ony=organism.ny
					return myOrganisms.indexOf(organism)==-1
				},this),
				mergedOrganism=new Organism(),
				totalSize=myOrganisms
					.map(function(myOrganism){return myOrganism.size})
					.reduce(function(a,b){return a+b})
			mergedOrganism.src=myOrganisms

			Object.keys(Organism.prototype).forEach(function(key){
				var totalValue=myOrganisms
					.map(function(myOrganism){return myOrganism[key]*myOrganism.size})
					.reduce(function(a,b){return a+b})
				mergedOrganism[key]=totalValue/totalSize
			})

			var action=this.findBestAction(mergedOrganism,otherOrganisms,this.depth)

			if (action){
				switch(action.type){
					case 'move':
						this.move(~~action.x,~~action.y)
					break;
					case 'split':
						this.move(~~action.x,~~action.y)
						this.allowSplit=false
						setTimeout(function(){this.allowSplit=true}.bind(this),this.splitCooldown)
						this.split()
					break;
					case 'shoot':
						this.move(~~action.x,~~action.y)
						this.allowShoot=false
						setTimeout(function(){this.allowShoot=true}.bind(this),this.shootCooldown)
						this.shoot()
					break;
				}
				this.lastAction=action
			}

			if (this.currentState!='alive'){
				this.lastStateChangeDate=new Date
				this.pings.push(Date.now()-startGameDate)
				this.pings=this.pings.slice(this.pings.length-400,this.pings.length)
				this.avgPing=this.pings.reduce(function(a,b,i){return a+b*Math.pow(2,i)})/(this.pings.map(function(a,i){return Math.pow(2,i)}).reduce(function(a,b){return a+b})+1)
			}
			this.scoreHistory.push(score)
			this.currentState='alive'
		}else{
			if(this.currentState=='alive'){
				var stat=new Stat(
						this.lastStateChangeDate,
						new Date,
						this.scoreHistory,
						this.considerations.map(function(consideration){return consideration.weight}))

				if(this.lastAction){
					var mOrganism=this.lastAction.myOrganism
					var oOrganism=this.lastAction.otherOrganism
					stat.lastActionOtherOrganismSize=this.lastAction.otherOrganism.size
					stat.lastActionOtherOrganismDist=Math.pow(Math.pow(mOrganism.nx-oOrganism.nx,2)+Math.pow(mOrganism.ny-oOrganism.ny,2),.5)
					stat.lastActionOtherOrganismPv=this.lastAction.otherOrganism.v
					stat.lastActionMyOrganismPv=this.lastAction.myOrganism.v
					stat.lastActionMyOrganismSize=this.lastAction.myOrganism.size
					stat.cushion=this.cushion
					stat.ping=this.pings[this.pings.length-1]
					stat.avgPing=this.avgPing

						//TODO maybe use max cushion instead of avg?
					if(
						mOrganism.size<oOrganism.size*.85
						&&oOrganism.size-oOrganism.cushion/2>stat.lastActionOtherOrganismDist	
					){

						var cushion=oOrganism.size-oOrganism.cushion/2-stat.lastActionOtherOrganismDist
						this.cushions.push(cushion)
						this.cushions=this.cushions.slice(this.cushions.length-400,this.cushions.length)
						Ai.prototype.cushion=this.cushions.reduce(function(a,b,i){return a+b*i})
							/(this.cushions
								.map(function(a,i){return i})
								.reduce(function(a,b){return a+b})+1)
					}
				}

				this.gameHistory.push(stat)

				var slicedGameHistory=this.gameHistory.slice(this.gameHistory.length-400>0?this.gameHistory.length-400:0,this.gameHistory.length)
				chrome.storage.local.set({gameHistory:slicedGameHistory}) 

				var weights=this.totalWeights
				for(var i=this.gameHistory.length-1;i<this.gameHistory.length;i++){
					var stat=this.gameHistory[i],
						totalWeight=stat.considerationWeights.reduce(function(a,b){return a+b})
					for(var j=0;j<stat.considerationWeights.length;j++){
						var maxScore=Math.max.apply(null,stat.scores);
						var weightedScore=Math.pow(2,Math.pow(maxScore,.5)-100)
						this.totalWeightedScore+=weightedScore
		
						weights[j]+=stat.considerationWeights[j]/totalWeight*weightedScore
					}
				}

				this.totalWeights=weights

				weights=[]

				if(!this.isTeachMode){
					for(var i=0;i<this.totalWeights.length;i++){
						//weights[i]=Math.ceil(weights[i]/this.gameHistory.length)
						weights[i]=Math.ceil(this.totalWeights[i]/this.totalWeightedScore)
					}
					var avgWeight=weights.reduce(function(a,b){return a+b})/weights.length	
					for(var i=0;i<weights.length;i++){
						weights[i]+=Math.ceil(Math.random()*avgWeight*100/(this.gameHistory.length%2?1:this.gameHistory.length)+1)
						if(this.considerations[i]){
							this.considerations[i].weight=weights[i]
						}
					}
				}
				this.onDeath()
				this.scoreHistory=[]
				this.lastStateChangeDate=new Date
			}
			this.currentState='dead'
		}

		this.onTick()
	},
	genActions:function(myOrganism,otherOrganism){
		return this.actionGenerators
			.filter(function(actionGenerator){return actionGenerator.filter(myOrganism,otherOrganism,this.specialNames)},this)
			.map(function(actionGenerator){
				var action=actionGenerator.genAction(myOrganism,otherOrganism)
				
				if(myOrganism.size<otherOrganism.size*.85){
					action.ox=action.x
					action.oy=action.y
					
				/*
					var	weightA=10, 
						//weightB=Math.pow(5600-myOrganism.nx,2)+Math.pow(5600-myOrganism.ny,2)
						weightB=1
							//min=0 max=5600
					action.x=(action.x*weightA+5600*weightB)/(weightA+weightB)
					action.y=(action.y*weightA+5600*weightB)/(weightA+weightB)
					*/
					var angle=Math.atan2(action.y-5600,action.x-5600),
						pullingX,
						pullingY
					if(angle>=0&&angle<=Math.PI/4
						||angle>=Math.PI*3/4&&angle<=Math.PI
					){
						pullingX=5600
						pullingY=8400	
					}else if(angle>=Math.PI/4&&angle<=Math.PI/2
						||angle<=-Math.PI/4&&angle>=-Math.PI/2
					){
						pullingX=8400
						pullingY=5600
					}else if(angle>=Math.PI/2&&angle<=Math.PI*3/4
						||angle<=-Math.PI/2&&angle>=-Math.PI*3/4
					){
						pullingX=2400
						pullingY=5600
					}else{
						pullingX=5600
						pullingY=2800
					}

					action.x=(action.x+pullingX)/2
					action.y=(action.y+pullingY)/2
				}

				if(
					action.type=='move'
					&&otherOrganism.name!="Best route"
					&&!otherOrganism.isVirus
					&&myOrganism.size<otherOrganism.size*.85
					&&Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)
						<otherOrganism.cushion*2+otherOrganism.size+myOrganism.cushion+Ai.prototype.cushion
				){
					action.importance=Math.pow(this.actionGenerators.length,this.considerations.length)
					action.x=myOrganism.nx*2-otherOrganism.nx
					action.y=myOrganism.ny*2-otherOrganism.ny
				}else{
					action.importance=actionGenerator.weightedCalc(myOrganism,otherOrganism)+Math.pow(this.actionGenerators.length,action.calcImportance(this.considerations))
				}
			
				if(myOrganism.size<otherOrganism.size*.85){
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
				}
				return action
			},this)
			.filter(function(a){return (a.type!='split'||this.allowSplit)&&(a.type!='shoot'||this.allowShoot)},this)
	},
	findBestAction:function(myOrganism,otherOrganisms,depth){ 
		var actions=[]
		for(var i=0;i<otherOrganisms.length;i++){
			actions=this.genActions(myOrganism,otherOrganisms[i]).concat(actions)
		}

		if (actions.length > 1){
			var virusTotalImportance=0,
				organismTotalImportance=0,
				organism=new Organism,
				virus=new Organism,
				virusSrcActions=[],
				organismSrcActions=[]

			actions.filter(function(action){
					return action.type=='move'
					&&action.otherOrganism.isVirus
					&&myOrganism.size*.85>action.otherOrganism.size
			}).forEach(function(action){
				virusSrcActions.push(action)
				virusTotalImportance+=action.importance
				Object.keys(Organism.prototype).forEach(function(key){
					virus[key]+=action.otherOrganism[key]*action.importance
				})
			})

			if(virusTotalImportance){
				Object.keys(Organism.prototype).forEach(function(key){
					virus[key]/=virusTotalImportance
				})
				
				virus.name="Best anti-virus route" 
				virus.isVirus=true

				actions=actions.concat(
					this.genActions(myOrganism,virus).map(function(a){a.srcActions=virusSrcActions; return a})
				)
			}

			actions.filter(function(action){ 
				return action.type=='move'
					&&!action.otherOrganism.isVirus
					&&myOrganism.size<action.otherOrganism.size*.85
			}).forEach(function(action){
				organismSrcActions.push(action)
				organismTotalImportance+=action.importance
				Object.keys(Organism.prototype).forEach(function(key){
					organism[key]+=action.otherOrganism[key]*action.importance
				})
			})

			if(organismTotalImportance){
				Object.keys(Organism.prototype).forEach(function(key){
					organism[key]/=organismTotalImportance
				})
				
				organism.name="Best route"
				organism.isVirus=false
				
				actions=actions.concat(
					this.genActions(myOrganism,organism).map(function(a){a.srcActions=organismSrcActions; return a})
				)
			}
		}

		if(depth){
			actions.sort(function(a,b){return b.importance-a.importance})
			actions=actions.slice(0,Math.pow(actions.length,Math.pow(2,this.depth)/Math.pow(40,depth))+(this.depth==depth)).map(function(action){
				var results=this.simulateAction(myOrganism,otherOrganisms,action)
				action.next=this.findBestAction(results.myOrganism,results.otherOrganisms,depth-1)
				if(action.next){
					if(action.next.myOrganism.size>action.next.otherOrganism.size){
						action.importance+=action.next.importance
					}else{
						action.importance-=action.next.importance
					}
				}
				return action
			},this)
		}

		actions.sort(function(a,b){return b.importance-a.importance})

		this.lastActionBest5=actions.slice(0,5)

		return actions[0]
	},
	heatMapType:6,
	draw:function(ctx){
		var lastAction=this.lastAction
		miniMapCtx.clearRect(0,0,175,175)

		miniMapCtx.strokeStyle='rgb(52,152,219)'
		for(var i=0;i<this.otherOrganisms.length;i++){
			var otherOrganism=this.otherOrganisms[i]
			miniMapCtx.beginPath()
			miniMapCtx.arc(otherOrganism.nx/64,otherOrganism.ny/64,otherOrganism.size/64,0,2*Math.PI)
			miniMapCtx.stroke()
		}

		if (lastAction){
			miniMapCtx.strokeStyle="#FFFFFF"
			miniMapCtx.beginPath()
			miniMapCtx.arc(lastAction.myOrganism.nx/64,lastAction.myOrganism.ny/64,lastAction.myOrganism.size/64,0,2*Math.PI)
			miniMapCtx.stroke()
		}

		if(this.heatmapEnabled
			&&this.lastAction
			&&this.lastAction.myOrganism
			&&this.lastAction.myOrganism.src
			&&this.lastAction.myOrganism.src.length
		){
			var mOrganism=this.lastAction.myOrganism.src[0],
				size=~~mOrganism.size*2

			if ([3,4,9,11].indexOf(this.heatMapType)!=-1){
				for(var x=mOrganism.x-12*size;x<mOrganism.x+12*size;x+=size){
					for(var y=mOrganism.y-10*size;y<mOrganism.y+10*size;y+=size){
						var cOrganism=new Organism
						Object.keys(mOrganism).forEach(function(key){
							cOrganism[key]=mOrganism[key]
						})
						cOrganism.nx=x
						cOrganism.ny=y
						
						var value=Math.max.apply(null,this.otherOrganisms
								.filter(function(oOrganism){return this.considerations[this.heatMapType].filter(cOrganism,oOrganism,{type:'move'})},this)
								.map(function(oOrganism){
							return this.considerations[this.heatMapType].weightedCalc(cOrganism,oOrganism,{type:'move'},true)
						},this))/2
						if(value==Infinity){
							value=1
						}
						if(value>0){
							ctx.fillStyle='rgba(255,255,100,'+value+')'
							ctx.fillRect(x-~~(size/2),y-~~(size/2),size,size)
						}	
					}
				}
			}else if([0,1,2,8,10].indexOf(this.heatMapType)!=-1){
				this.otherOrganisms
					.filter(function(oOrganism){
						return this.considerations[this.heatMapType].filter(mOrganism,oOrganism,{type:'move'})
					},this)
					.forEach(function(oOrganism){
						var value=this.considerations[this.heatMapType].weightedCalc(mOrganism,oOrganism,{type:'move'},true)
						ctx.fillStyle='rgba(255,255,100,'+value+')'
						ctx.fillRect(oOrganism.nx-~~oOrganism.size*2,oOrganism.ny-~~oOrganism.size*2,oOrganism.size*4,oOrganism.size*4)
					},this)	
			}else if([6,7].indexOf(this.heatMapType)!=-1){
				for(var x=mOrganism.x-12*size;x<mOrganism.x+12*size;x+=size){
					for(var y=mOrganism.y-10*size;y<mOrganism.y+10*size;y+=size){
						var cOrganism=new Organism
						Object.keys(mOrganism).forEach(function(key){
							cOrganism[key]=mOrganism[key]
						})
						cOrganism.nx=x
						cOrganism.ny=y
					
						var value=this.considerations[this.heatMapType].weightedCalc({},cOrganism,{type:'move'},true)
						if(value==Infinity){
							value=1
						}
						if(value>0){
							ctx.fillStyle='rgba(255,255,100,'+value+')'
							ctx.fillRect(x-~~(size/2),y-~~(size/2),size,size)
						}	

					}
				}
				
			}
		}

		if(this.linesEnabled){
			var myOrganism
			ctx.lineCap='round'

			if(lastAction){
				if(lastAction.weightedValues[0]){
					ctx.lineWidth=1
					var consideration=lastAction.weightedValues[0][1]
					ctx.strokeStyle=consideration.color
					consideration.draw(ctx,lastAction.myOrganism,lastAction.otherOrganism)
				}
					
				if(lastAction.ox){
					ctx.beginPath()
					ctx.setLineDash([5])
					ctx.strokeStyle='rgb(180,180,180)'
					ctx.moveTo(lastAction.myOrganism.nx,lastAction.myOrganism.ny)
					ctx.lineTo(lastAction.ox,lastAction.oy)
					ctx.stroke()
					ctx.setLineDash([0])
				}
			}

			for(var j=2;j>=0;j-=2){
				lastAction=this.lastAction
				if(lastAction){
					ctx.lineWidth=this.badRing[j+1]
					ctx.strokeStyle=this.badRing[j+0]
					myOrganism=lastAction.myOrganism
					if(lastAction.srcActions){
						for(var i=0;i<lastAction.srcActions.length;i++){
							ctx.beginPath()
							ctx.arc(
								lastAction.srcActions[i].otherOrganism.nx,
								lastAction.srcActions[i].otherOrganism.ny,
								lastAction.srcActions[i].otherOrganism.size+~~lastAction.srcActions[i].otherOrganism.cushion,
								0,
								2*Math.PI
							)
							ctx.stroke()
						}

						ctx.lineWidth/=2
						for(var i=0;i<lastAction.srcActions.length;i++){
								ctx.beginPath()
								ctx.arc(
									lastAction.srcActions[i].otherOrganism.nx,
									lastAction.srcActions[i].otherOrganism.ny,
									lastAction.srcActions[i].otherOrganism.size,
									0,
									2*Math.PI
								)
								ctx.stroke()
	
							ctx.beginPath()
							ctx.moveTo(myOrganism.nx,myOrganism.ny)
							ctx.lineTo(lastAction.srcActions[i].otherOrganism.nx,lastAction.srcActions[i].otherOrganism.ny)
							ctx.stroke()
						}
					}else if(lastAction.otherOrganism.isVirus||lastAction.otherOrganism.size>myOrganism.size){
						ctx.beginPath()
						ctx.arc(lastAction.otherOrganism.nx,lastAction.otherOrganism.ny,lastAction.otherOrganism.size+~~lastAction.otherOrganism.cushion,0,2*Math.PI)
						ctx.stroke()
						
						ctx.lineWidth/=2
						ctx.beginPath()
						ctx.moveTo(myOrganism.nx,myOrganism.ny)
						ctx.lineTo(lastAction.otherOrganism.nx,lastAction.otherOrganism.ny)
						ctx.stroke()

						ctx.beginPath()
						ctx.arc(lastAction.otherOrganism.nx,lastAction.otherOrganism.ny,lastAction.otherOrganism.size,0,2*Math.PI)
						ctx.stroke()
					}
				
					ctx.strokeStyle=this.goodRing[j+0]
					ctx.lineWidth=this.goodRing[j+1]
					while(lastAction){
						myOrganism=lastAction.myOrganism
						ctx.beginPath()
						ctx.moveTo(myOrganism.nx,myOrganism.ny)
						ctx.lineTo(lastAction.x,lastAction.y)
						ctx.stroke()
						lastAction=lastAction.next
					}

					lastAction=this.lastAction
					ctx.strokeStyle=this.myRing[j+0]
					ctx.lineWidth=this.myRing[j+1]
					ctx.beginPath()

					if(lastAction.myOrganism.src.length==1){
						var organism=lastAction.myOrganism.src[0]
						ctx.arc(
							organism.x,
							organism.y,
							organism.size+~~lastAction.myOrganism.cushion,
							0,
							2*Math.PI)
					}else{
						ctx.arc(
							lastAction.myOrganism.nx,
							lastAction.myOrganism.ny,
							lastAction.myOrganism.size+~~lastAction.myOrganism.cushion,
							0,
							2*Math.PI)
					}
					ctx.stroke()
					
					ctx.lineWidth/=2
					ctx.beginPath()
					if(lastAction.myOrganism.src.length==1){
						var organism=lastAction.myOrganism.src[0]
						ctx.arc(
							organism.x,
							organism.y,
							organism.size,
							0,
							2*Math.PI)
					}else{
						ctx.arc(
							lastAction.myOrganism.nx,
							lastAction.myOrganism.ny,
							lastAction.myOrganism.size,
							0,
							2*Math.PI)
					}
					ctx.stroke()
				}
			}
		}
		this.onDraw()
	}
}
for(key in AiPrototype){
	Ai.prototype[key]=AiPrototype[key]
}

//TODO Become sentient.








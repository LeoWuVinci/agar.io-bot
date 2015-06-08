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

var Organism=function(){this.dCoords=[]}
Organism.prototype={
	x:0,
	y:0,
	px:0,
	py:0,
	pv:0,
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
		this.min=value<this.min?value:this.min
		this.max=value>this.max?value:this.max
		return (value-this.min)/(this.max-this.min)*this.weight
	},
}

var ActionGenerator=function(label,filter,calcPriority,weight,color,genAction){
	Consideration.call(this,label,filter,calcPriority,weight,color)
	this.genAction=genAction
}

ActionGenerator.prototype=Object.create(Consideration.prototype)
var actionGeneratorPrototype={
	genAction:function(myOrganism,otherOrganism){}
}
for(var key in actionGeneratorPrototype){
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
var AiPrototype={
	splitCooldown:10000,
	depth:3,
	onDraw:function(){},
	specialNames:{},
	onTick:function(){},
	totalWeights:[],
	totalMaxSize:0,
	isTeachMode:1,
	lastActionBest5:[],
	predictionDepth:2,
	cushion:200,
	considerations:[
		new Consideration(
			"Avoid Virus Attackers",
			function(myOrganism,otherOrganism,action){return otherOrganism.isVirus&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size
			},
			1,
			'#FF5A5E'
		),
		new Consideration(
			"Avoid Blob w/ Slightly Larger Mass",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus&&myOrganism.size<otherOrganism.size&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			1,
			'#335A5E'
		),
		new Consideration(
			"Chase Blob w/ Slightly Smaller Mass",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus&&myOrganism.size>otherOrganism.size&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return -Math.abs(myOrganism.size-otherOrganism.size)
			},
			1000,
			'#AA5A5E'
		),
		new Consideration(
			"Chase Nearest Smaller Blob",
			function(myOrganism,otherOrganism,action){return !otherOrganism.isVirus&&myOrganism.size>otherOrganism.size&&action.type=='move'},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)-otherOrganism.pv+myOrganism.size+myOrganism.pv
			},
			1500,
			'#46BFBD'
		),
		new Consideration(
			"Avoid Nearest Larger Blob",
			function(myOrganism,otherOrganism,action){
				return !otherOrganism.isVirus&&myOrganism.size<otherOrganism.size&&action.type=='move'
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.px-myOrganism.px,2)+Math.pow(otherOrganism.py-myOrganism.py,2),.5)+otherOrganism.pv+otherOrganism.size
			},
			1,
			'#46BF00'
		),
		new Consideration(
			"Avoid Colliding into Larger Blob",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
				&&!otherOrganism.isVirus
				&&myOrganism.size<otherOrganism.size
				&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)<=otherOrganism.pv+otherOrganism.size+Ai.prototype.cushion},
			function(myOrganism,otherOrganism,action){
				return true;
			},
			5000,
			'#EEEEEE'
		),
		new Consideration(
			"Avoid Colliding into Virus",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
					&&otherOrganism.isVirus
					&&myOrganism.size>otherOrganism.size
					&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)<=myOrganism.size //TODO Consider taking out pow(,.5)
			},
			function(myOrganism,otherOrganism,action){
				return true
			},
			2000,
			'rgb(163,73,164)'
		) ,
		new Consideration(
			"Chase towards Middle of Map",
			function(myOrganism,otherOrganism,action){return myOrganism.size>otherOrganism.size&&!otherOrganism.isVirus&&action.type!='split'},
			function(myOrganism,otherOrganism,action){
				return -Math.pow(5600-action.x,2)-Math.pow(5600-action.y,2)
			},
			100,
			'#FDB45C'
		),
		new Consideration(
			"Avoid Splitters",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
					&&!otherOrganism.isVirus
					&& otherOrganism.size>63
					&& myOrganism.size*2<otherOrganism.size
				},
			function(myOrganism,otherOrganism,action){
				return myOrganism.size-otherOrganism.size
			},
			75,
			'#33EE33'
		),
		new Consideration(
			"Avoid Nearest Virus",
			function(myOrganism,otherOrganism,action){
				return action.type=='move'&&otherOrganism.isVirus&&myOrganism.size>otherOrganism.size
			},
			function(myOrganism,otherOrganism,action){ //THIS IS CORRECT DONT CHANGE
				return -Math.pow(Math.pow(otherOrganism.px-myOrganism.px,2)+Math.pow(otherOrganism.py-myOrganism.py,2),2)+myOrganism.size
			},
			1,
			'#46FF22'
		),
		new Consideration(
			"Chat Movements", //10 second delay lolz
			function(myOrganism,otherOrganism,action){
				return action.type=='move'
			},
			function(myOrganism,otherOrganism,action){
				switch(action.direction){
					case 'up':
						return -action.y
					case 'down':
						return action.y
					case 'left':
						return -action.x
					case 'right':
						return action.x
					default:
						return 0;
				}
			},
			0,
			'#A0BB33'
		),
		new Consideration(
			"Split on smaller blob",
			function(myOrganism,otherOrganism,action){
				return action.type=='split'&&myOrganism.size>otherOrganism.size*2.15	
			},
			function(myOrganism,otherOrganism,action){
				return otherOrganism.size-myOrganism.size
			},
			1,
			'#AD4433'
		),
		new Consideration(
			'Split on farther blob',
			function(myOrganism,otherOrganism,action){
				return action.type=='split'&&myOrganism.size>otherOrganism.size*2.15	
			},
			function(myOrganism,otherOrganism,action){
				return Math.pow(otherOrganism.px-myOrganism.px,2)+Math.pow(otherOrganism.py-myOrganism.py,2)
			},
			1,
			'#AD4477'
		),
		new Consideration(
			"Split to escape",
			function(myOrganism,otherOrganism,action){
				return action.type=='split'
				&&!otherOrganism.isVirus
				&&otherOrganism.name!="Best route"
				&&myOrganism.size<otherOrganism.size
				&&Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)<=otherOrganism.size+otherOrganism.pv+~~(Ai.prototype/3)},
			function(myOrganism,otherOrganism,action){ //Compares with dodging or just moving away
				return true
			},
			1,
			'#EEEEEE'
		),
		new Consideration(
			"Shoot to flee faster",
			function(myOrganism,otherOrganism,action){
				var dist=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)

				return action.type=='shoot'
				&&otherOrganism.name!="Best route"
				&&myOrganism.size<otherOrganism.size
				&&dist>otherOrganism.size+otherOrganism.pv+~~(Ai.prototype/3)
				&&dist<=otherOrganism.size+otherOrganism.pv+~~(Ai.prototype*2/3)
				},
			function(myOrganism,otherOrganism,action){ //Compares with dodging or just moving away
				return true
			},
			1,
			'#ABCD00'
		),
		new Consideration(
			"Shoot to bait",
			function(myOrganism,otherOrganism,action){
				return action.type=='shoot'
					&&myOrganism.size>otherOrganism.size
			},
			function(){
				return true
			},
			1,
			"#AFCC99"
		)
	],
	direction:'',
	actionGenerators:[
		new ActionGenerator(
			"Intercept small blob",
			function(myOrganism,otherOrganism,specialNames){
				return !otherOrganism.isVirus
					&&otherOrganism.size<myOrganism.size*.9
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#FF0000',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dCoords[1][0],2)+Math.pow(otherOrganism.dCoords[1][1],2),.5)
				//tells us how long it will take to reach the midpoint
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('move',
					myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0]+otherOrganism.px+otherOrganism.dCoords[1][0]*tickCount,
					myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1]+otherOrganism.py+otherOrganism.dCoords[1][1]*tickCount,
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
				return Math.pow(myOrganism.px-otherOrganism.py,2)+Math.pow(myOrganism.py-otherOrganism.py,2)
			},
			1,
			'#00FF00',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dCoords[1][0],2)+Math.pow(otherOrganism.dCoords[1][1],2),.5)
				//tells us how long it will take to reach the midpoint
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('move',
					(myOrganism.px+myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0])*2-otherOrganism.px-otherOrganism.dCoords[1][0]*tickCount,
					(myOrganism.py+myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1])*2-otherOrganism.py-otherOrganism.dCoords[1][1]*tickCount,
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"B line away from big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus&&otherOrganism.size>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return -Math.pow(myOrganism.x-otherOrganism.x,2)-Math.pow(myOrganism.y-otherOrganism.y,2)
			},
			1,
			'#0000FF',
			function(myOrganism,otherOrganism){
				return new Action('move',
					(myOrganism.px+myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0])*2-otherOrganism.px-otherOrganism.dCoords[1][0]-otherOrganism.dCoords[2][0],
					(myOrganism.py+myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1])*2-otherOrganism.py-otherOrganism.dCoords[1][1]-otherOrganism.dCoords[2][1],
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
					(myOrganism.px+myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0])*2-otherOrganism.px,
					(myOrganism.py+myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1])*2-otherOrganism.py,
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"Split small blob",
			function(myOrganism,otherOrganism,specialNames){
				var dist=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5),
					ftrDist=Math.pow(Math.pow(myOrganism.px+myOrganism.dCoords[1][0]-otherOrganism.px-otherOrganism.dCoords[1][0],2)+Math.pow(myOrganism.py+myOrganism.dCoords[1][1]-otherOrganism.py-otherOrganism.dCoords[1][1],2),.5)

				return !otherOrganism.isVirus
					&&otherOrganism.size>48
					&&otherOrganism.size*2.1<myOrganism.size
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')
					&&dist<ftrDist
					&&dist<550-myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#FFFF00',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dCoords[1][0],2)+Math.pow(otherOrganism.dCoords[1][1],2),.5)
				//tells us how long it will take to reach the midpoint
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('split',
					myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0]+otherOrganism.px+otherOrganism.dCoords[1][0]*tickCount,
					myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1]+otherOrganism.py+otherOrganism.dCoords[1][1]*tickCount,
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"Split away from big blob",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus
					&&myOrganism.size>64
					&&otherOrganism.size>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#0000FF',
			function(myOrganism,otherOrganism){
				return new Action('split',
					(myOrganism.px+myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0])*2-otherOrganism.px-otherOrganism.dCoords[1][0]-otherOrganism.dCoords[2][0],
					(myOrganism.py+myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1])*2-otherOrganism.py-otherOrganism.dCoords[1][1]-otherOrganism.dCoords[2][1],
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"Shoot to flee",
			function(myOrganism,otherOrganism){
				return !otherOrganism.isVirus
					&&myOrganism.size>64
					&&otherOrganism.size>myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#AA00CC',
			function(myOrganism,otherOrganism){
				return new Action('shoot',
					(myOrganism.px+myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0])*2-otherOrganism.px-otherOrganism.dCoords[1][0]-otherOrganism.dCoords[2][0],
					(myOrganism.py+myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1])*2-otherOrganism.py-otherOrganism.dCoords[1][1]-otherOrganism.dCoords[2][1],
					myOrganism,
					otherOrganism)
			}
		),
		new ActionGenerator(
			"Shoot to bait",
			function(myOrganism,otherOrganism,specialNames){
				var dist=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5),
					ftrDist=Math.pow(Math.pow(myOrganism.px+myOrganism.dCoords[1][0]-otherOrganism.px-otherOrganism.dCoords[1][0],2)+Math.pow(myOrganism.py+myOrganism.dCoords[1][1]-otherOrganism.py-otherOrganism.dCoords[1][1],2),.5)

				return !otherOrganism.isVirus
					&&otherOrganism.size>48
					&&otherOrganism.size*2.2<myOrganism.size
					&&(!specialNames[otherOrganism.name]||specialNames[otherOrganism.name]=='ignore')
					&&dist<ftrDist
					&&dist<750-myOrganism.size
					&&dist>650-myOrganism.size
			},
			function(myOrganism,otherOrganism){
				return true
			},
			1,
			'#CC12FF',
			function(myOrganism,otherOrganism){
				var tickCount=Math.pow(Math.pow(myOrganism.px-otherOrganism.px,2)+Math.pow(myOrganism.py-otherOrganism.py,2),.5)/2/Math.pow(Math.pow(otherOrganism.dCoords[1][0],2)+Math.pow(otherOrganism.dCoords[1][1],2),.5)
				//tells us how long it will take to reach the midpoint
				if (tickCount == Infinity){
					tickCount=0
				}

				return new Action('shoot',
					myOrganism.dCoords[1][0]+myOrganism.dCoords[2][0]+otherOrganism.px+otherOrganism.dCoords[1][0]*tickCount,
					myOrganism.dCoords[1][1]+myOrganism.dCoords[2][1]+otherOrganism.py+otherOrganism.dCoords[1][1]*tickCount,
					myOrganism,
					otherOrganism)
			}
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
	simulateAction:function(myOrganism,otherOrganisms,action){
		var tickCount=(myOrganism.dCoords[1][0]+myOrganism.dCoords[1][1]>0)?(Math.pow(Math.pow(action.x-myOrganism.px,2)+Math.pow(action.y-myOrganism.py,2),.5)/Math.pow(Math.pow(myOrganism.dCoords[1][0],2)+Math.pow(myOrganism.dCoords[1][1],2),.5)):0,
			clonedMyOrganism=new Organism
		
		Object.keys(myOrganism).forEach(function(key){clonedMyOrganism[key]=myOrganism[key]})
		clonedMyOrganism.px=action.x
		clonedMyOrganism.py=action.y

		return {
			myOrganism:clonedMyOrganism,
			otherOrganisms:otherOrganisms
				.filter(function(a){return a.id!=action.otherOrganism.id})
				.map(function(organism){
					var clone=new Organism
					Object.keys(organism).forEach(function(key){clone[key]=organism[key]})
					clone.id=organism.id
					clone.px+=clone.dCoords[1][0]*tickCount
					clone.py+=clone.dCoords[1][1]*tickCount
					return clone
				})
		}
	},
	tick:function(organisms,myOrganisms,score){
		var otherOrganisms=this.otherOrganisms=organisms.filter(function(organism){
			if(!organism.px && this.specialNames[organism.name]){
				this.onFoundSpecialName(organism.name)
			}

			if(!organism.dCoords){
				organism.dCoords=[[0,0],[0,0],[0,0]]
				organism.pDCoords=[]
				organism.dvs=[]
				organism.pdvs=[]
			}

			organism.dCoords[0]=[organism.nx,organism.ny]
			organism.px=0
			organism.py=0

			organism.dCoords.every(function(coord,i){
				if(!organism.pDCoords[i]){
					organism.pDCoords[i]=[coord[0],coord[1]]
				}
				organism.dCoords[i+1]=[coord[0]-organism.pDCoords[i][0],coord[1]-organism.pDCoords[i][1]]

				organism.px+=organism.dCoords[i][0]
				organism.py+=organism.dCoords[i][1]
				organism.pDCoords[i]=[coord[0],coord[1]]
				return i<this.predictionDepth&&(organism.dCoords[i+1][0]||organism.dCoords[i+1][1])
			},this)
			organism.dvs[0]=Math.pow(Math.pow(organism.dCoords[1][0],2)+Math.pow(organism.dCoords[1][1],2),.5)
			organism.px=organism.nx
			organism.py=organism.ny
			organism.pv=organism.dvs[0]
			/*
			organism.dvs.every(function(dv,i){
				if(!organism.pdvs[i]){
					organism.pdvs[i]=dv
				}
				organism.dvs[i+1]=dv-organism.pdvs[i]
				organism.pv+=organism.dvs[i]
				organism.pdvs[i]=dv
				return organism.dvs[i+1]
			})
			*/

			return myOrganisms.indexOf(organism)==-1
		},this)

		if (myOrganisms.length){
			var mergedOrganism=new Organism(),
				totalSize=myOrganisms
					.map(function(myOrganism){return myOrganism.size})
					.reduce(function(a,b){return a+b})


			//TODO Calculate dCoords
			Object.keys(Organism.prototype).forEach(function(key){
				var totalValue=myOrganisms
					.map(function(myOrganism){return myOrganism[key]*myOrganism.size})
					.reduce(function(a,b){return a+b})
				mergedOrganism[key]=totalValue/totalSize
			})

			myOrganisms.forEach(function(myOrganism){
				myOrganism.dCoords.forEach(function(dCoord,i){
					if(!mergedOrganism.dCoords[i]){
						mergedOrganism.dCoords[i]=[0,0]
					}
					mergedOrganism.dCoords[i][0]+=dCoord[0]*myOrganism.size
					mergedOrganism.dCoords[i][1]+=dCoord[1]*myOrganism.size
				})
			})
			
			mergedOrganism.dCoords.forEach(function(dCoord){
				dCoord[0]/=totalSize
				dCoord[1]/=totalSize
			})

			var action=this.findBestAction(mergedOrganism,otherOrganisms,this.depth)

			if (action){
				switch(action.type){
					case 'move':
						this.move(action.x,action.y)
					break;
					case 'split':
						this.move(action.x,action.y)
						this.allowSplit=false
						setTimeout(function(){this.allowSplit=true}.bind(this),this.splitCooldown)
						this.split()
					break;
					case 'shoot':
						this.move(action.x,action.y)
						this.allowShoot=false
						setTimeout(function(){this.allowShoot=true}.bind(this),this.shootCooldown)
						this.shoot()
					break;
				}

				if(!this.lastAction
					||this.lastAction.otherOrganism.name!=action.otherOrganism.name
				){
					if(action.otherOrganism.isVirus){
						console.info("avoiding virus", action.otherOrganism.name,[action])
					}else if (action.otherOrganism.size>mergedOrganism.size){
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
//TODO Move heatmap to script.js
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
	genActions:function(myOrganism,otherOrganism){
		return this.actionGenerators
			.filter(function(actionGenerator){return actionGenerator.filter(myOrganism,otherOrganism,this.specialNames)},this)
			.map(function(actionGenerator){
				var action=actionGenerator.genAction(myOrganism,otherOrganism)

				//TODO Curve wall?
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

				if(this.direction){
					action.direction=this.direction
				}

				action.importance=actionGenerator.weightedCalc(myOrganism,otherOrganism)*action.calcImportance(this.considerations)
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
			var totalImportance=0,
				organism=new Organism,
				virus=new Organism,
				srcActions=[]

			actions.filter(function(action){ //TODO Merged threat for virus or organism?
				return action.type=='move'
					&&action.otherOrganism.isVirus
					&&myOrganism.size>action.otherOrganism.size
					||!action.otherOrganism.isVirus
					&&myOrganism.size<action.otherOrganism.size
			}).forEach(function(action){
				srcActions.push(action)
				totalImportance+=action.importance
				Object.keys(Organism.prototype).forEach(function(key){
					organism[key]+=action.otherOrganism[key]*action.importance
				})
				

				action.otherOrganism.dCoords.forEach(function(dCoord,i){
					if(!organism.dCoords[i]){
						organism.dCoords[i]=[0,0]
					}
					organism.dCoords[i][0]+=dCoord[0]*action.importance
					organism.dCoords[i][1]+=dCoord[1]*action.importance
				})
			})

			if(totalImportance){
				organism.dCoords.forEach(function(dCoord){
					dCoord[0]/=totalImportance
					dCoord[1]/=totalImportance
				})
				
				Object.keys(Organism.prototype).forEach(function(key){
					organism[key]/=totalImportance
					virus[key]=organism[key]
				})
				
				organism.name="Best route"
				organism.isVirus=false
				virus.name="Best anti-virus route" 
				virus.isVirus=true
				virus.dCoords=organism.dCoords

				actions=actions.concat(
					this.genActions(myOrganism,organism).map(function(a){a.srcActions=srcActions; return a}),
					this.genActions(myOrganism,virus).map(function(a){a.srcActions=srcActions; return a})
				)
			}
		}

		if(depth){
			actions.sort(function(a,b){return b.importance-a.importance})
			actions=actions.slice(0,Math.pow(actions.length,Math.pow(2,this.depth)/Math.pow(40,depth))+(this.depth==depth)).map(function(action){
				var results=this.simulateAction(myOrganism,otherOrganisms,action)
				action.next=this.findBestAction(results.myOrganism,results.otherOrganisms,depth-1)
				if(action.next){
					action.importance+=action.next.importance
				}
				return action
			},this)
		}

		actions.sort(function(a,b){return b.importance-a.importance})

		this.lastActionBest5=actions.slice(0,5)

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
			miniMapCtx.strokeRect((lastAction.myOrganism.x-lastAction.myOrganism.size)/64,(lastAction.myOrganism.y-lastAction.myOrganism.size)/64,lastAction.myOrganism.size*2/64,lastAction.myOrganism.size*2/64)
		}

		if(this.linesEnabled){
			if(lastAction){
				ctx.beginPath()
				ctx.strokeStyle="#FFFFFF"
				ctx.lineWidth=1
				ctx.arc(lastAction.myOrganism.px,lastAction.myOrganism.py,lastAction.myOrganism.size+lastAction.myOrganism.pv,0,2*Math.PI)
				ctx.stroke()

				ctx.strokeStyle="#FF0000"
				if(lastAction.srcActions){
					ctx.strokeStyle='#FF0000'
					ctx.lineWidth=1
					for(var i=0;i<lastAction.srcActions.length;i++){
						ctx.beginPath()
						ctx.arc(
							lastAction.srcActions[i].otherOrganism.px,
							lastAction.srcActions[i].otherOrganism.py,
							lastAction.srcActions[i].otherOrganism.size+lastAction.srcActions[i].otherOrganism.pv,0,2*Math.PI)
						ctx.stroke()
					}
				}
			}
			while(lastAction){
				var myOrganism=lastAction.myOrganism

				if(this.lastAction==lastAction&&(!lastAction.srcActions || !lastAction.srcActions.length)){
					ctx.beginPath()
					ctx.lineWidth=5
					if(lastAction.otherOrganism.isVirus||lastAction.otherOrganism.size>myOrganism.size){
						ctx.strokeStyle='#FF0000'
					}else{
						ctx.strokeStyle='#00FF00'
					}
					ctx.moveTo(myOrganism.px,myOrganism.py)
					ctx.lineTo(lastAction.otherOrganism.px,lastAction.otherOrganism.py)
					ctx.stroke()

					ctx.beginPath()
					ctx.lineWidth=1
					ctx.arc(lastAction.otherOrganism.px,lastAction.otherOrganism.py,lastAction.otherOrganism.size+lastAction.otherOrganism.pv,0,2*Math.PI)
					ctx.stroke()
				}

				ctx.lineWidth=2
				ctx.beginPath()
				ctx.strokeStyle="#FFFFFF"
				ctx.moveTo(myOrganism.px,myOrganism.py)
				ctx.lineTo(lastAction.x,lastAction.y)
				ctx.stroke()

				if(this.lastAction==lastAction&&lastAction.srcActions){
					ctx.lineWidth=2
					ctx.strokeStyle='#FF0000'
					for(var i=0;i<lastAction.srcActions.length;i++){
						ctx.beginPath()
						ctx.moveTo(myOrganism.px,myOrganism.py)
						ctx.lineTo(lastAction.srcActions[i].otherOrganism.px,lastAction.srcActions[i].otherOrganism.py)
						ctx.stroke()

					}
				}
				lastAction=lastAction.next
			}
		}
		this.onDraw()
	}
}
for(key in AiPrototype){
	Ai.prototype[key]=AiPrototype[key]
}

//TODO Become sentient.








/*
Advance Tactics
1. Using viruses to trap players
2. Shoot at viruses to break large blobs
   */

var Action=function(type,fitness,x,y,organism){
	this.type=type
	this.x=x
	this.y=y
	this.fitness=fitness
	this.organism=organism
}
Action.prototype={
	type:'', //move,split,shoot
	x:0,
	y:0,
	fitness:0,
	organism:null
}

//Map is 11200x11200
Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false
var canvas=$('<canvas id="score-history-chart" width="200" height="200"></canvas>')
$('body').append(canvas);
var ctx=canvas.get(0).getContext("2d")
var labels=[],
	data1=[],
	data2=[]
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}

var chart=new Chart(ctx).Line({labels:labels,datasets:[{
		label: "Score History",
		fillColor: "rgba(220,220,220,0.2)",
		strokeColor: "rgba(220,220,220,1)",
		data: data1
	},
	{
		label: "Game History",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]});

var behaviorCanvas=$('<div id="bot-intuition"><h4>Bot Intuition</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorCanvas)
var behaviorCtx=$('#behavior-canvas').get(0).getContext("2d")

var Consideration=function(label,consider,weight,color){
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.consider=consider;	
}

Consideration.prototype={
	weight:1,
	   label:'',
	   color:'',
	   get value(){
		   return ~~this.weight;
	   }	
}

var Bot=function(move,split,shoot){
	BotInterface.call(this,move,split,shoot)
	this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.considerations)
}

Bot.prototype=Object.create(BotInterface.prototype)
//size = radius
//score=size*size/100
BotPrototype={
	splitted:false,
	considerations:[
		new Consideration(
			"Size Difference",
			function(myOrganism,otherOrganism,actionType){
				if(otherOrganism.isVirus){
					return (myOrganism.size-otherOrganism.size)/2000-2	
				}else{
					return -Math.abs(myOrganism.size-otherOrganism.size)/100
				}
			},
			1,
			'#FF5A5E'	
		),
		new Consideration(
			"Nearest Target",
			function(myOrganism,otherOrganism,actionType){
				return -(Math.pow(Math.pow(myOrganism.x+myOrganism.dx-otherOrganism.x-otherOrganism.dx,2)+Math.pow(myOrganism.y+myOrganism.dy-otherOrganism.y-otherOrganism.dy,2),.5)-myOrganism.size-otherOrganism.size)/1000
			},
			1,
			'#46BFBD'
		),
		new Consideration(
			"Map Edge Avoidance",
			function(myOrganism,otherOrganism,actionType){
				return -(Math.pow(Math.pow(5575-otherOrganism.x-otherOrganism.dx,2)+Math.pow(5575-otherOrganism.y-otherOrganism.dy,2),.5))/5575
			},
			1,
			'#FDB45C'
		),
		new Consideration(
			"Splitter Avoidance",
			function(myOrganism,otherOrganism,actionType){
				if (otherOrganism.isVirus){
					return -1
				}else{
					return -Math.abs(otherOrganism.size-myOrganism.size*2)/100 //likelyhood to stay away from splitters
				}
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
	dodgeDist:100, //px TODO dynamically change dodgeDist based on ping
	calcFitness:function(myOrganism,organism,action){ //map size 11150
		fitnessScore=0
		considerationValues=[]
		for(var i=0;i<this.considerations.length;i++){
			var considerationValue=this.considerations[i].consider(myOrganism,organism,action)
			considerationValues.push(considerationValue)
			fitnessScore+=(10+considerationValue)*this.considerations[i].weight
		}
		return [fitnessScore,considerationValues]
	},
	lastBestAction:"",
	currentState:'',
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	myOrganisms:[],
	onTick:function(organisms,myOrganisms,score){
		var otherOrganisms=organisms.filter(function(organism){
			if(organism.x2){
				organism.dx=organism.x-organism.x2

				if(organism.pdx){
					organism.dx2=organism.dx-organism.pdx
					organism.px=organism.x+organism.dx+organism.dx2
				}
				organism.pdx=organism.dx
			}
			if(organism.y2){
				organism.dy=organism.y-organism.y2

				if(organism.pdy){
					organism.dy2=organism.dy-organism.pdy
					organism.py=organism.y+organism.dy+organism.dy2
				}
				organism.pdy=organism.dy
			}
			organism.x2=organism.x
			organism.y2=organism.y
			return myOrganisms.indexOf(organism)==-1
		})
		this.myOrganisms=myOrganisms

		var bestActions=[]
		for(var i=0;i<myOrganisms.length;i++){
			bestActions.push(this.findBestAction(otherOrganisms,myOrganisms[i],score))
		}
		if (bestActions.length){
			var myOrganism=myOrganisms[0],
				bestAction=bestActions[0]
			//Eliminates drag against invisible wall
			if (bestAction.x+myOrganism.size>11200){
				bestAction.x=11200-myOrganism.size;
				bestAction.y+=bestAction.y-myOrganism.y
			}else if(bestAction.x-myOrganism.size<0){
				bestAction.x=myOrganism.size;
				bestAction.y+=bestAction.y-myOrganism.y
			}
			if (bestAction.y+myOrganism.size>11200){
				bestAction.y=11200-myOrganism.size;
				bestAction.x+=bestAction.x-myOrganism.x
			}else if(bestAction.y-myOrganism.size<0){
				bestAction.y=myOrganism.size;
				bestAction.x+=bestAction.x-myOrganism.x
			}

			switch(bestAction.type){
				case 'move':
					this.move(bestAction.x,bestAction.y)
				break;
				case 'split':
					this.move(bestAction.x,bestAction.y)
					this.splitted=true
					this.split()
				break;
				case 'shoot':
					this.move(bestAction.x,bestAction.y)
					this.shoot()
				break;	
			}
			
			if(!this.lastBestAction
				||this.lastBestAction.organism.name!=bestAction.organism.name
			){
				if(bestAction.organism.isVirus){
					console.log("avoiding virus", bestAction.organism.name,[bestAction])
				}else if (bestAction.organism.size>myOrganism.size){
					console.log("avoiding", bestAction.organism.name,[bestAction])
				}else{
					console.log("chasing", bestAction.organism.name,[bestAction])
				}
			}
			this.lastBestAction=bestAction
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

			if(!(this.scoreHistory.length%10)){
				var j=0;
				for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
					/*
					if(j){
						chart.datasets[0].points[j].value=~~((this.scoreHistory[i]-this.scoreHistory[i-1])/100)
					}
					j++	
				*/	
					chart.datasets[0].points[j++].value=~~(this.scoreHistory[i]/100)	
				}

				j=0
				for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
					var gameStats=this.gameHistory[i];
					chart.datasets[1].points[10*j++].value=~~(gameStats[2][gameStats[2].length-1]/100)	
				}
				chart.update()
			}

			var needsUpdate=false
			for(var i=0;i<this.considerations.length;i++){
				if(this.behaviorChart.segments[i].value!=this.considerations[i].value){
					this.behaviorChart.segments[i].value=this.considerations[i].value
					needsUpdate=true
				}
			}
			if(needsUpdate){
				this.behaviorChart.update()
			}
			
			this.currentState='alive'
		}

	},
	findBestAction:function(otherOrganisms,myOrganism,score){
		var bestAction
		for(var i=0;i<otherOrganisms.length;i++){
			var organism=otherOrganisms[i],
				action

			var tickCount=Math.pow(Math.pow(myOrganism.x-organism.x,2)+Math.pow(myOrganism.y-organism.y,2),.5)/Math.pow(Math.pow(myOrganism.dx,2)+Math.pow(myOrganism.dy,2),.5);

			if (organism.isVirus&&organism.size<myOrganism.size
						||!organism.isVirus&&organism.size*.85>myOrganism.size
			){
				if(Math.pow(Math.pow(myOrganism.x+myOrganism.dx-organism.x-organism.dx,2)+Math.pow(myOrganism.y+myOrganism.dy-organism.y-organism.dy,2),.5)-myOrganism.size-organism.size<0){
					action=new Action(
						'move',
						this.calcFitness(myOrganism,organism),
						myOrganism.x+myOrganism.x-organism.x,
						myOrganism.y+myOrganism.y-organism.y,
						organism)
					action.fitness[0]*=2
					console.log("dodging ",organism.name)
				}else{
					action=new Action(
						'move',
						this.calcFitness(myOrganism,organism),
						(myOrganism.x+myOrganism.dx)*2-(organism.x+tickCount*organism.dx),
						(myOrganism.y+myOrganism.dy)*2-(organism.y+tickCount*organism.dy),
						organism)
				}
			}else if (!organism.isVirus
					&&organism.size<myOrganism.size*.85){

				var moveFitness=this.calcFitness(myOrganism,organism),
					splitFitness=this.calcFitness(myOrganism,organism,'split')
				if (
						organism.size<myOrganism.size*.3
						||organism.size>myOrganism.size*.425
						||moveFitness[0]>=splitFitness[0]
						||myOrganism.size<65
						||this.splitted
						||Math.pow(Math.pow(organism.x-myOrganism.x,2)+Math.pow(organism.y-myOrganism.y,2),.5)>myOrganism.size*3
				){
					/* FIXME SPlitter needs to be rethought
					if(myOrganisms.length>1){
						this.splitted=false //resets the split mechanism early
					}
					*/
					action=new Action('move',moveFitness,organism.x+organism.dx+tickCount*organism.dx,organism.y+organism.dy+tickCount*organism.dy,organism)
				}else{
					action=new Action('split',splitFitness,organism.x,organism.y,organism)
				}
			}

			if(!bestAction||bestAction.fitness[0]<action.fitness[0]){ //TODO Sort the actions instead
				bestAction=action
			}
		}
		return bestAction
	},
	draw:function(ctx){ //TODO Consider multiple blobs
		var myOrganisms=this.myOrganisms
		if(this.lastBestAction&&myOrganisms.length>0){
			var myOrganism=myOrganisms[0]
			ctx.beginPath()

			if(this.lastBestAction.organism.isVirus||this.lastBestAction.organism.size>myOrganism.size){
				ctx.strokeStyle='red'
			}else{
				ctx.strokeStyle='green'
			}	
			ctx.moveTo(myOrganism.x,myOrganism.y)
			ctx.lineTo(this.lastBestAction.organism.x,this.lastBestAction.organism.y)
			ctx.stroke()
			
			ctx.beginPath()
			ctx.strokeStyle="blue"
			ctx.moveTo(myOrganism.x,myOrganism.y)
			ctx.lineTo(this.lastBestAction.x,this.lastBestAction.y)
			ctx.stroke()
		}
	}
}
for(key in BotPrototype){
	Bot.prototype[key]=BotPrototype[key]
}

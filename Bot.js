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

//Map is 11150x11150
Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false
var canvas=$('<canvas id="score-history-chart" width="200" height="200" style="position:fixed"></canvas>')
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

var behaviorCanvas=$('<div style="position:fixed;width:100%;bottom:5px;text-align:center"><h4>Bot Behavior</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
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
		   return this.weight;
	   }	
}

var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
	this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.considerations)
}

//size = radius
//score=size*size/100
Bot.prototype={
	largestSize:0,
	reflex:100,
	randomness:0, //or noise?
	splitted:false,
	considerations:[
		new Consideration(
			"Similar Size",
			function(myOrganism,otherOrganism,actionType){
				return 10-(!otherOrganism.isVirus)*Math.abs(myOrganism.size-otherOrganism.size)/100
			},
			1,
			'#FF5A5E'	
		),
		new Consideration(
			"Vicinity",
			function(myOrganism,otherOrganism,actionType){
				return 10-(Math.pow(Math.pow(myOrganism.x-otherOrganism.x,2)+Math.pow(myOrganism.y-otherOrganism.y,2),.5)-myOrganism.size-otherOrganism.size)/1000
			},
			2,
			'#46BFBD'
		),
		new Consideration(
			"Map Edge Avoidance",
			function(myOrganism,otherOrganism,actionType){
				return 10-(Math.pow(Math.pow(5575-otherOrganism.x,2)+Math.pow(5575-otherOrganism.y,2),.5))/5575
			},
			3,
			'#FDB45C'
		),
		new Consideration(
			"Enemy Split Avoidance",
			function(myOrganism,otherOrganism,actionType){
				return 10-(!otherOrganism.isVirus)*Math.abs(otherOrganism.size-myOrganism.size*2)/100 //likelyhood to stay away from splitters
			},
			1,
			'#33EE33'
		),
		new Consideration(
			"Split based on Size",
			function(myOrganism,otherOrganism,actionType){
				return 10-(actionType=='split')*((otherOrganism.size-myOrganism.size)/5000+1)
			},
			0,
			'#FF0000'
		),
		new Consideration(
			"Split based on distance",
			function(myOrganism,otherOrganism,actionType){
				var distance=0 //FIXME Find the correct distance
				return 10-(actionType=='split')*-distance
			},
			0,
			'#FF0000'
		)
	],
	dodgeDist:100, //px TODO dynamically change dodgeDist based on ping
	calcFitness:function(myOrganism,organism,action){ //map size 11150
		fitnessScore=0
		considerationValues=[]
		for(var i=0;i<this.considerations.length;i++){
			var considerationValue=this.considerations[i].consider(myOrganism,organism,action)
			considerationValues.push(considerationValue)
			fitnessScore+=considerationValue*this.considerations[i].weight
		}
		return [fitnessScore,considerationValues]
	},
	lastBestAction:"",
	currentState:'',
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	onTick:function(organisms,myOrganisms,score){
		var myOrganism=myOrganisms[0],
			otherOrganisms=organisms.filter(function(organism){
				return myOrganisms.indexOf(organism)==-1
			})

		if (myOrganisms.length<1){
			if(this.currentState!='dead'){
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

		if (myOrganism.size>this.largestSize){
			this.largestSize=myOrganism.size
		}

		var bestAction=null
		for(var i=0;i<otherOrganisms.length;i++){
			var organism=otherOrganisms[i],
				action

				if (organism.isVirus&&organism.size<myOrganism.size
							||!organism.isVirus&&organism.size*.85>myOrganism.size
				){
					action=new Action(
							'move',
							this.calcFitness(myOrganism,organism),
							myOrganism.x+myOrganism.x-organism.x,
							myOrganism.y+myOrganism.y-organism.y,
							organism)
					if(action.fitness[1].distance > 10-this.dodgeDist/1000){
						action.fitness[0]+=this.reflex
						console.log("dodging ",organism.name)
					}
				}else if (!organism.isVirus
						&&organism.size<myOrganism.size*.85){

					var moveFitness=this.calcFitness(myOrganism,organism),
						splitFitness=this.calcFitness(myOrganism,organism,'split')
					if (
							organism.size<myOrganism.size*.3
							||organism.size>myOrganism.size*.425
							||moveFitness[0]>=splitFitness[0]
							||myOrganisms.length>1
							||myOrganism.size<65
							||this.splitted
							||Math.pow(Math.pow(organism.x-myOrganism.x,2)+Math.pow(organism.y-myOrganism.y,2),.5)>myOrganism.size*3
					){
						if(myOrganisms.length>1){
							this.splitted=false //resets the split mechanism early
						}
						action=new Action('move',moveFitness,organism.x,organism.y,organism)
					}else{
						action=new Action('split',splitFitness,organism.x,organism.y,organism)
					}
				}

			if(!bestAction||bestAction.fitness[0]<action.fitness[0]){
				bestAction=action
			}
		}

		if(bestAction){
			bestAction.x+=Math.random()*this.randomness*2-this.randomness
			bestAction.y+=Math.random()*this.randomness*2-this.randomness

			//Eliminates drag against invisible wall
			if (bestAction.x+myOrganism.size>11150){
				bestAction.x=11200-myOrganism.size;
			}else if(bestAction.x-myOrganism.size<0){
				bestAction.x=myOrganism.size;
			}
			if (bestAction.y+myOrganism.size>11150){
				bestAction.y=11200-myOrganism.size;
			}else if(bestAction.y-myOrganism.size<0){
				bestAction.y=myOrganism.size;
			}

			this.doAction(bestAction)
			if(!this.lastBestAction
				||this.lastBestAction.organism.name!=bestAction.organism.name
				||~~this.lastBestAction.fitness[0]!=~~bestAction.fitness[0]
			){
				if(bestAction.organism.isVirus){
					console.log("avoiding virus", bestAction.organism.name,bestAction)
				}else if (bestAction.organism.size>myOrganism.size){
					console.log("avoiding", bestAction.organism.name,bestAction)
				}else{
					console.log("chasing", bestAction.organism.name,bestAction)
				}
			}
			this.lastBestAction=bestAction
		}
	},
	doAction:function(action){
		switch(action.type){
			case 'move':
				this.move(action.x,action.y)
			break;
			case 'split':
				this.move(action.x,action.y)
				this.splitted=true
				this.split()
			break;
			case 'shoot':
				this.move(action.x,action.y)
				this.shoot()
			break;	
		 }
	 },
	move:function(x,y){}, //overwrite these in main_out.js
	split:function(){},
	shoot:function(){},
	onDraw:function(ctx,myOrganisms){ //TODO Consider multiple blobs
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
		}
	}
}

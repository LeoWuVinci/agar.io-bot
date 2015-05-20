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
var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
}

//size = radius
//score=size*size/100
Bot.prototype={
	largestSize:0,
	reflex:100,
	randomness:0, //or noise?
	splitted:false,
	fitnessWeights:{
		sizeDiff:1,
		distance:2,
		midMapDistance:3,
		twiceSizeDiff:1,
		halfMySize:0,//1
		splitDist:0 //3
	},
	calcFitness:function(myOrganism,organism,action){ //map size 11150
		var distance=-(Math.pow(Math.pow(myOrganism.x-organism.x,2)+Math.pow(myOrganism.y-organism.y,2),.5)-myOrganism.size-organism.size)/1000,
			fitnessTraits={
				sizeDiff:-(!organism.isVirus)*Math.abs(myOrganism.size-organism.size)/100,
				distance:distance,
				midMapDistance:-(Math.pow(Math.pow(5575-organism.x,2)+Math.pow(5575-organism.y,2),.5))/5575,
				twiceSizeDiff:(!organism.isVirus)*-Math.abs(organism.size-myOrganism.size*2)/100, //likelyhood to stay away from splitters
				halfMySize:(action=='split')*((organism.size-myOrganism.size)/5000+1),
				splitDist:(action=='split')*-distance
				},
			fitnessScore=100
		
		for(key in fitnessTraits){
			fitnessScore+=fitnessTraits[key]*this.fitnessWeights[key]
		}
		return [fitnessScore,fitnessTraits]
	},
	lastBestAction:"",
	onState:function(organisms,myOrganisms){
		var myOrganism=myOrganisms[0],
			otherOrganisms=organisms.filter(function(organism){
				return myOrganisms.indexOf(organism)==-1
			})
	
		if (myOrganisms.length<1){
			console.log("dead x_X")
			return
		}

		if (myOrganism.size>this.largestSize){
			this.largestSize=myOrganism.size
		}

		var bestAction=null
		for(var i=0;i<otherOrganisms.length;i++){
			var organism=otherOrganisms[i],
				action

				if (organism.isVirus&&organism.size<myOrganism.size*1.15
							||!organism.isVirus&&organism.size*.85>myOrganism.size
				){
					action=new Action(
							'move',
							this.calcFitness(myOrganism,organism),
							myOrganism.x+myOrganism.x-organism.x,
							myOrganism.y+myOrganism.y-organism.y,
							organism)
					if(action.fitness[1].distance > 0){
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
			this.doAction(bestAction)
			bestAction.fitness[0]=Math.round(bestAction.fitness[0])
			if(!this.lastBestAction
				||this.lastBestAction.organism.name!=bestAction.organism.name
				||this.lastBestAction.fitness[0]!=bestAction.fitness[0]
			){
				if (bestAction.organism.size>myOrganism.size){
					if (bestAction.organism.isVirus){
						console.log("avoiding virus", bestAction.organism.name,bestAction)
					}else{
					console.log("avoiding", bestAction.organism.name,bestAction)
					}
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
	shoot:function(){}
}

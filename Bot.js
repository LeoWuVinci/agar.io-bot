var Action=function(type,fitness,x,y){
	this.type=type
	this.x=x
	this.y=y
	this.fitness=fitness
}
Action.prototype={
	type:'',
	x:0,
	y:0,
	fitness:0
}

//Map is 11150x11150
var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
}
Bot.prototype={
	largestSize:0,
	reflex:100,
	randomness:0, //or noise?
	splitted:false,
	fitnessWeights:{
		sizeDiff:1,
		distance:2,
		midMapDistance:2,
		twiceSizeDiff:1,
		halfMySize:1,
		splitDist:1
	},
	calcFitness:function(myOrganism,organism,action){ //map size 11150
		var distance=-(Math.pow(Math.pow(myOrganism.x-organism.x,2)+Math.pow(myOrganism.y-organism.y,2),.5)-myOrganism.size-organism.size)/1000,
			fitnessTraits={
				sizeDiff:-Math.abs(myOrganism.size-organism.size)/100,
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
	name:"",
	lastBestAction:"",
	onState:function(organisms){
		var myOrganisms=[],
			myOrganism=null
		
		for (key in organisms){
			var organism=organisms[key];
			if(organism.name==this.name){
				myOrganism=organism
				myOrganisms.push(organism)
			}
		}

		if (!myOrganism){
			return
		}

		if (myOrganism.size>this.largestSize){
			this.largestSize=myOrganism.size
		}

		var bestAction=null

		for (key in organisms){
			var organism=organisms[key],
				action

			if (organism.name!=myOrganism.name){
				if (organism.isVirus&&organism.size*1.85<myOrganism.size
							||organism.size*.85>myOrganism.size
				){
					action=new Action(
							'move',
							this.calcFitness(myOrganism,organism),
							myOrganism.x+myOrganism.x-organism.x,
							myOrganism.y+myOrganism.y-organism.y)
					action.organism=organism

					if(action.fitness[1].distance >-.05){
						console.log("reflexively avoiding ",organism.name)
						action.fitness[0]+=this.reflex
					}
				}else if (!organism.isVirus
						&&organism.size<myOrganism.size*.85){

					var moveFitness=this.calcFitness(myOrganism,organism),
						splitFitness=this.calcFitness(myOrganism,organism,'split')
					if (
							organism.size<myOrganism.size*.3
							||organism.size>myOrganism.size*.4
							||moveFitness[0]>=splitFitness[0]
							||myOrganisms.length>1
							||myOrganism.size<130
							||this.splitted
					){
						if(myOrganisms.length>1){
							this.splitted=false //resets the split mechanism early
						}
						action=new Action('move',moveFitness,organism.x,organism.y)
					}else{
						console.log('split',myOrganisms.length)
						action=new Action('split',splitFitness)
					}
					action.organism=organism
				}
			}

			if(!bestAction||bestAction.fitness[0]<action.fitness[0]){
				bestAction=action
				if(bestAction){
					bestAction.organismName=organism.name
				}
			}
		}

		if(bestAction){
			bestAction.x+=Math.random()*this.randomness*2-this.randomness
			bestAction.y+=Math.random()*this.randomness*2-this.randomness
			this.doAction(bestAction)
			bestAction.fitness[0]=Math.round(bestAction.fitness[0])
			if((true||bestAction.organism.name)
					&&bestAction
					&&(!this.lastBestAction
						||this.lastBestAction.organismName!=bestAction.organismName
						||this.lastBestAction.fitness[0]!=bestAction.fitness[0])
			){
				if (bestAction.organism.size>myOrganism.size){
					if (bestAction.organism.isVirus){
						console.log("avoiding virus", bestAction.organism.name,bestAction.fitness)

					}else{
					console.log("avoiding", bestAction.organism.name,bestAction.fitness)
					}
				}else{
					console.log("chasing", bestAction.organism.name,bestAction.fitness)
				}
				this.lastBestAction=bestAction
			}
		}
	},
	doAction:function(action){
		switch(action.type){
			case 'move':
				this.move(action.x,action.y)
			break;
			case 'split':
				this.splitted=true
				this.split()
			break;
			case 'shoot':
				this.shoot()
			break;	
		 }
	 },
	move:function(x,y){}, //overwrite these in main_out.js
	split:function(){},
	shoot:function(){}
}

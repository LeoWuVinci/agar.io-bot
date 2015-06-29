"use strict";
function Stat(startDate,endDate,maxScore,considerationWeights){
	this.startDate=startDate
	this.endDate=endDate
	this.maxScore=maxScore
	this.considerationWeights=considerationWeights
}
Stat.prototype={
	startDate:null,
	endDate:null,
	maxScore:0,
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

function Consideration(label,filter,calc){
	this.filter=filter;
	this.label=label;
	this.calc=calc;
}

Consideration.prototype={
	weight:1,
	label:'',
	get value(){
		return ~~this.weight;
   	},
	calc:function(myOrganism,otherOrganism,action){},
	min:0,
	max:0,
	weightedCalc:function(myOrganism,otherOrganism){
		var value=this.calc(myOrganism,otherOrganism)
		this.min=value<this.min?value:this.min
		this.max=value>this.max?value:this.max
		return (value-this.min)/(this.max-this.min)*this.weight
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

function ActionGenerator(label,filter,calcPriority,genAction,considerations){
	Consideration.call(this,label,filter,calcPriority)
	this.considerations=considerations
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
	this.move=move
	this.split=split
	this.shoot=shoot

	this.considerations=[]
	this.actionGenerators.forEach(function(actionGenerator){
		actionGenerator.considerations.forEach(function(consideration){
			this.considerations.push(consideration)
		},this)
	},this)

	chrome.storage.local.get(["gameHistory5",'exp'],function(items){
		if(items.gameHistory5){
			var weights=[]
			for(var i=0;i<this.considerations.length;i++){
				weights[i]=0
			}

			for(var i=0;i<items.gameHistory5.length;i++){
				var stat=items.gameHistory5[i],
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
		if(items.exp){
			this.exp=items.exp	
		}
	}.bind(this))
}

Ai.prototype={
	mapMinX:-7071.067811865476,
	mapMinY:-7071.067811865476,
	mapMaxX:7071.067811865476,
	mapMaxY:7071.067811865476,
	get mapMidX(){
		return (this.mapMaxX-this.mapMinX)/2+this.mapMinX
	},
	get mapMidY(){
		return (this.mapMaxY-this.mapMinY)/2+this.mapMinY
	},
	score:0,
	exp:0,
	get lvl(){
		return ~~Math.pow(this.exp,.25)
	},
	get lvlPercent(){
		return ~~(
			(this.exp-Math.pow(this.lvl,4))
			/(Math.pow(this.lvl+1,4)-Math.pow(this.lvl,4))
			*100)
	},
	nicks:[],
	totalWeightedScore:0,
	cushions:[],
	pings:[],
	splitCooldown:10000,
	depth:3,
	onDraw:function(){},
	totalWeights:[],
	allowIntuition:false,
	lastActionBest5:[],
	cushion:0,
	heatmapEnabled:false,
	actionGenerators:[
		new ActionGenerator(
				"Intercept small blob",
				function(myOrganism,otherOrganism,specialNames){
				return !otherOrganism.isVirus&&otherOrganism.size<myOrganism.size*.85
				},
				function(myOrganism,otherOrganism){
				return true
				},
				function(myOrganism,otherOrganism){
				var tickCount=otherOrganism.v?Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v:0
				return new Action('move',
						otherOrganism.nx+otherOrganism.dx*tickCount,
						otherOrganism.ny+otherOrganism.dy*tickCount,
						myOrganism,
						otherOrganism)
				},[
				new Consideration(
					"Chase Blob w/ Slightly Smaller Mass",
					function(){return true},
					function(myOrganism,otherOrganism){
						return otherOrganism.size-myOrganism.size
					}
					),
					new Consideration(
							"Chase Nearest Smaller Blob",
							function(){return true},
							function(myOrganism,otherOrganism){
							return -Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.2)
							}
							),
					new Consideration(
							"Chase Smaller Blobs near Edge",
							function(myOrganism,otherOrganism){return otherOrganism.v},
							function(myOrganism,otherOrganism){
							return Math.pow(ai.mapMidX-otherOrganism.nx,2)+Math.pow(ai.mapMidY-otherOrganism.ny,2)
							}
							),
					]
						),
					new ActionGenerator(
							"Juke big blob",
							function(myOrganism,otherOrganism){
							return !otherOrganism.isVirus&&otherOrganism.size*.85>myOrganism.size
							},
							function(myOrganism,otherOrganism){
							return true
							},
							function(myOrganism,otherOrganism){
							var tickCount=otherOrganism.v?Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)/2/otherOrganism.v:0
							return new Action('move',
									myOrganism.nx*2-otherOrganism.nx-otherOrganism.dx*tickCount,
									myOrganism.ny*2-otherOrganism.ny-otherOrganism.dy*tickCount,
									myOrganism,
									otherOrganism)
							},
							[
							new Consideration(
								"Avoid Blob w/ Slightly Larger Mass",
								function(){return true},
								function(myOrganism,otherOrganism){
								return -Math.abs(myOrganism.size-otherOrganism.size)
								}
								),
							new Consideration(
									"Avoid Nearest Larger Blob",
									function(){return true},
									function(myOrganism,otherOrganism){ //THIS IS CORRECT DONT CHANGE
									return -Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.1)
									}
									),
							new Consideration(
									"Avoid Bigger Blobs near Edge",
									function(){return true},
									function(myOrganism,otherOrganism){
									return Math.pow(ai.mapMidX-otherOrganism.nx,2)+Math.pow(ai.mapMidY-otherOrganism.ny,2)
									}
									),
							new Consideration(
									"Avoid Splitters",
									function(myOrganism,otherOrganism){return otherOrganism.size>63&&myOrganism.size<otherOrganism.size*.425},
									function(myOrganism,otherOrganism){
									return myOrganism.size-otherOrganism.size
									}
									),
							new Consideration(
									"Avoid when split",
									function(){return true},
									function(){
									return Ai.prototype.myOrganisms.length
									}
									)
								]
								),
							new ActionGenerator(
									"B line away from virus",
									function(myOrganism,otherOrganism){
									return otherOrganism.isVirus&&otherOrganism.size<myOrganism.size*.85
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
									[
									new Consideration(
										"Avoid Virus Attackers",
										function(myOrganism,otherOrganism){
										return Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.5)<660
										},
										function(myOrganism,otherOrganism){
										return myOrganism.size-otherOrganism.size
										}
										),
							new Consideration(
									"Avoid Colliding into Virus",
									function(myOrganism,otherOrganism){
									return Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)<=myOrganism.size+myOrganism.cushion
									},
									function(myOrganism,otherOrganism){
									return true
									}
									),
							new Consideration(
									"Avoid Nearest Virus",
									function(){return true},
									function(myOrganism,otherOrganism){ //THIS IS CORRECT DONT CHANGE
									return -Math.pow(Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2),.1)
									}
									),
							]
								),
							new ActionGenerator(
									"Split small blob",
									function(myOrganism,otherOrganism){
									var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5),
									ftrDist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx-otherOrganism.dx,2)+Math.pow(myOrganism.ny-otherOrganism.ny-otherOrganism.dy,2),.5)

									return !otherOrganism.isVirus
									&&otherOrganism.v
									&&otherOrganism.size>48
									&&otherOrganism.size<myOrganism.size*.425
									&&dist<ftrDist
									&&dist<500-myOrganism.size
									&&Ai.prototype.allowSplit
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
									},[
				new Consideration(
						"Split on smaller blob",
						function(){return true},
						function(myOrganism,otherOrganism){
						return otherOrganism.size-myOrganism.size
						}
						),
					new Consideration(
							'Split on farther blob',
							function(){return true},
							function(myOrganism,otherOrganism){
							return Math.pow(otherOrganism.nx-myOrganism.nx,2)+Math.pow(otherOrganism.ny-myOrganism.ny,2)
							}
							)
									]
									),
					new ActionGenerator(
							"Shoot to bait",
							function(myOrganism,otherOrganism){
							var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5),
							ftrDist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx-otherOrganism.dx,2)+Math.pow(myOrganism.ny-otherOrganism.ny-otherOrganism.dy,2),.5)

							return !otherOrganism.isVirus
							&&otherOrganism.v
							&&otherOrganism.size>48
							&&otherOrganism.size<myOrganism.size*.425
							&&dist<ftrDist
							&&dist<750-myOrganism.size
							&&dist>650-myOrganism.size
							&&Ai.prototype.allowShoot
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
							},[
				new Consideration(
						"Shoot to bait",
						function(){return true},
						function(){
						return true
						}
						),

							]
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
	actionCooldown:0,
	tick:function(organisms,myOrganisms,score){
		if (score > this.score){
			this.exp+=score-this.score
		}
		this.score=score
		var otherOrganisms=this.otherOrganisms=organisms.filter(function(organism){
				organism.nx=organism.D
				organism.ny=organism.F
				organism.isVirus=organism.d
				
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
			},this)


		if(myOrganisms.length){
			var mergedOrganism=new Organism(),
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

			this.actionCooldown--
			if (action&&(this.actionCooldown<1||action.myOrganism.size<action.otherOrganism.size*.85||action.myOrganism.src.length>1||action.otherOrganism.v)){
				
				if(action.myOrganism.size<action.otherOrganism.size*.85
					&&Math.pow(Math.pow(action.x-this.mapMidX,2)+Math.pow(action.y-this.mapMidY,2),.5)>(this.mapMaxX-this.mapMinX)/2
				){
					var angle=Math.atan2(action.y-this.mapMidY,action.x-this.mapMidX)
					
					action.ox=action.x
					action.oy=action.y
					action.x=Math.cos(angle)*this.mapMidX+this.mapMidX
					action.y=Math.sin(angle)*this.mapMidY+this.mapMidY
				}

				switch(action.type){
					case 'move':
						this.move(~~action.x,~~action.y)
					break;
					case 'split':
						this.move(~~action.x,~~action.y)
						Ai.prototype.allowSplit=false
						setTimeout(function(){Ai.prototype.allowSplit=true}.bind(this),this.splitCooldown)
						this.split()
					break;
					case 'shoot':
						this.move(~~action.x,~~action.y)
						Ai.prototype.allowShoot=false
						setTimeout(function(){Ai.prototype.allowShoot=true}.bind(this),this.shootCooldown)
						this.shoot()
					break;
				}
				
				if(!action.otherOrganism.v&&action.myOrganism.size*.85>action.otherOrganism.size){			
					this.actionCooldown=action.myOrganism.v?
							~~((Math.pow(
								Math.pow(action.myOrganism.nx-action.otherOrganism.nx,2)+Math.pow(action.myOrganism.ny-action.otherOrganism.ny,2),.5)-action.myOrganism.size)
							/action.myOrganism.v/2)
						:0
				}else{
					this.actionCooldown=0
				}	
				this.lastAction=action
			}

			if (this.currentState!='alive'){

				this.lastStateChangeDate=new Date
				this.pings.push(Date.now()-startGameDate)

				_gaq.push(['_trackEvent', 'server', 'ping','start_game',this.pings[this.pings.length-1]]);
				this.pings=this.pings.slice(this.pings.length-400,this.pings.length)
				this.avgPing=this.pings.reduce(function(a,b,i){return a+b*Math.pow(2,i)})/(this.pings.map(function(a,i){return Math.pow(2,i)}).reduce(function(a,b){return a+b})+1)
			}
			this.scoreHistory.push(score)
			this.currentState='alive'
		}else{
			if(this.currentState=='alive'){
				var considerationWeights=this.actionGenerators
						.map(function(actionGenerator){
							return actionGenerator.considerations	
						})
						.reduce(function(a,b){
							return a.concat(b)
						})
						.map(function(consideration){
							return consideration.weight
						}),
					stat=new Stat(
						this.lastStateChangeDate,
						new Date,
						Math.max.apply(null,this.scoreHistory),
						considerationWeights)

				_gaq.push(['_trackEvent','bot','died','highest_score',stat.maxScore])
				_gaq.push(['_trackEvent','bot','died','score',this.scoreHistory[this.scoreHistory.length-1]])
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
				chrome.storage.local.set({
					gameHistory5:slicedGameHistory,
					exp:this.exp	
					}) 

				var weights=this.totalWeights
				for(var i=this.gameHistory.length-1;i<this.gameHistory.length;i++){
					var stat=this.gameHistory[i],
						totalWeight=stat.considerationWeights.reduce(function(a,b){return a+b})
					for(var j=0;j<stat.considerationWeights.length;j++){
						var weightedScore=Math.pow(2,Math.pow(stat.maxScore,.5)-100)
						this.totalWeightedScore+=weightedScore	
						weights[j]+=stat.considerationWeights[j]/totalWeight*weightedScore
					}
				}

				this.totalWeights=weights

				weights=[]

				if(this.allowIntuition){
					for(var i=0;i<this.totalWeights.length;i++){
						//weights[i]=Math.ceil(weights[i]/this.gameHistory.length)
						weights[i]=Math.ceil(this.totalWeights[i]/this.totalWeightedScore)
					}
					var avgWeight=weights.reduce(function(a,b){return a+b})/weights.length	
					for(var i=0;i<weights.length;i++){
						weights[i]+=Math.ceil(Math.random()*avgWeight*100/(this.gameHistory.length%2?1:this.gameHistory.length)+1)
					}
					var i=0;
					this.actionGenerators.forEach(function(actionGenerator){
						actionGenerator.considerations.forEach(function(consideration){
							consideration.weight=weights[i++]
						})
					})
				}
				this.onDeath()
				this.scoreHistory=[]
				this.lastStateChangeDate=new Date
			}
			this.currentState='dead'
		}
	},
	genActions:function(myOrganism,otherOrganism){
		var dist=Math.pow(Math.pow(myOrganism.nx-otherOrganism.nx,2)+Math.pow(myOrganism.ny-otherOrganism.ny,2),.5)
		
		if(otherOrganism.name!="Best route"
			&&!otherOrganism.isVirus
			&&myOrganism.size<otherOrganism.size*.85
			&&dist<(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)*3+otherOrganism.size
		){
			var action=new Action('',
					myOrganism.nx*2-otherOrganism.nx,
					myOrganism.ny*2-otherOrganism.ny,
					myOrganism,
					otherOrganism)
			action.importance=5
			
			if(
				Ai.prototype.allowSplit&&dist<otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion+otherOrganism.size
			){
				action.type='split'
				return [action]
			}else if(
					Ai.prototype.allowShoot&&dist<(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)*2+otherOrganism.size
			){
				action.type='shoot'
				return [action]
			}else if(
				dist<(otherOrganism.cushion+myOrganism.cushion+Ai.prototype.cushion)*3+otherOrganism.size
			){
				action.type='move'
				return [action]
			}
		}

		return this.actionGenerators
			.filter(function(actionGenerator){return actionGenerator.filter(myOrganism,otherOrganism)})
			.map(function(actionGenerator){
				var action=actionGenerator.genAction(myOrganism,otherOrganism) //TODO Postpone action generation
					action.importance=actionGenerator.weightedCalc(myOrganism,otherOrganism)+Math.pow(this.actionGenerators.length,action.calcImportance(actionGenerator.considerations))
				return action
			},this)
	},
	findBestAction:function(myOrganism,otherOrganisms,depth){
		var actions=[]
			otherOrganisms.forEach(function(oOrganism){
				actions=this.genActions(myOrganism,oOrganism).concat(actions)
			},this)

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
		miniMapCtx.clearRect(0,0,(ai.mapMaxX-ai.mapMinX)/64,(ai.mapMaxY-ai.mapMinY)/64)

		miniMapCtx.strokeStyle='rgb(52,152,219)'
		for(var i=0;i<this.otherOrganisms.length;i++){
			var otherOrganism=this.otherOrganisms[i]
			miniMapCtx.beginPath()
			miniMapCtx.arc((otherOrganism.nx-ai.mapMinX)/64,(otherOrganism.ny-ai.mapMinY)/64,otherOrganism.size/64,0,2*Math.PI)
			miniMapCtx.stroke()
		}

		if (lastAction){
			miniMapCtx.strokeStyle="#FFFFFF"
			miniMapCtx.beginPath()
			miniMapCtx.arc((lastAction.myOrganism.nx-ai.mapMinX)/64,(lastAction.myOrganism.ny-ai.mapMinY)/64,lastAction.myOrganism.size/64,0,2*Math.PI)
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

//TODO Become sentient.








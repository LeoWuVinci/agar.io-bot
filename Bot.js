var Coordinate=function(x,y,fitness){
	this.x=x
	this.y=y
	this.fitness=fitness
}
Coordinate.prototype={
	x:0,
	y:0,
	fitness:0
}

function calcFitness(myOrganism,organism){
	var sizeDiff=myOrganism.size-organism.size,
		distance=Math.pow(Math.pow(myOrganism.x-organism.x,2)+Math.pow(myOrganism.y-organism.y,2),.5),
		fitness=0

	fitness-=Math.abs(sizeDiff)

	return fitness-distance
}

var Bot=function(name,move){
	this.name=name;
	this.move=move;
}
Bot.prototype={
	name:"",
	onState:function(organisms){
		var myOrganism=null
		
		for (key in organisms){
			var organism=organisms[key];
			if(organism.name==this.name){
				myOrganism=organism
			}
		}

		if (!myOrganism){
			return
		}

		var bestCoordinate=null

		for (key in organisms){
			var organism=organisms[key],
				coordinate

			if (organism.name!=myOrganism.name){
				if (organism.isVirus&&organism.size<myOrganism.size
							||organism.size>myOrganism.size
				){
					coordinate=new Coordinate(
							myOrganism.x+myOrganism.x-organism.x,
							myOrganism.y+myOrganism.y-organism.y,
							calcFitness(myOrganism,organism))
				}else if (!organism.isVirus
						&&organism.size<myOrganism.size){
					coordinate=new Coordinate(
							organism.x,
							organism.y,
							calcFitness(myOrganism,organism))
				}
			}

			if(!bestCoordinate||bestCoordinate.fitness<coordinate.fitness){
				bestCoordinate=coordinate
			}
		}

		if(bestCoordinate){
			this.move(bestCoordinate.x,bestCoordinate.y)
		}
	},
	move:function(x,y){},
	split:function(){},
	fire:function(){}
}

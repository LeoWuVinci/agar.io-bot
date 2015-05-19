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


//Map is 11150x11150
function calcFitness(myOrganism,organism){
	var sizeDiff=Math.abs(myOrganism.size-organism.size)/2000,
		distance=(Math.pow(Math.pow(myOrganism.x-organism.x,2)+Math.pow(myOrganism.y-organism.y,2),.5)-myOrganism.size-organism.size)/1000,
		midDistance=(Math.pow(Math.pow(5500-organism.x,2)+Math.pow(5500-organism.y,2),.5))/5500,
		twiceSizeDiff=Math.abs(organism.size-myOrganism.size*2)/2000

	return -sizeDiff*2-distance*2-midDistance-twiceSizeDiff*3
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
							||organism.size*.8>myOrganism.size
				){
					coordinate=new Coordinate(
							myOrganism.x+myOrganism.x-organism.x,
							myOrganism.y+myOrganism.y-organism.y,
							calcFitness(myOrganism,organism))
					coordinate.organism=organism
				}else if (!organism.isVirus
						&&organism.size<myOrganism.size*.8){
					coordinate=new Coordinate(
							organism.x,
							organism.y,
							calcFitness(myOrganism,organism))
					coordinate.organism=organism
				}
			}

			if(!bestCoordinate||bestCoordinate.fitness<coordinate.fitness){
				bestCoordinate=coordinate
				if(organism.name&&coordinate){
					console.log(organism.name,Math.round(coordinate.fitness))
				}
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

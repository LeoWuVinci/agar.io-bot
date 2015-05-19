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
		for (key in organisms){
			var organism=organisms[key];
			if (!organism.isVirus&&myOrganism&&organism.nSize<myOrganism.nSize){
					this.move(organism.x,organism.y)
					break;
			}
		}
	},
	move:function(x,y){}
}

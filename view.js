/* Display logic */
Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false

var scoreCanvas=$('<canvas id="score-chart" width="200" height="200"></canvas>')
$('body').append(scoreCanvas);
var labels=[],
	data1=[],
	data2=[]
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}
var scoreChart=new Chart(scoreCanvas.get(0).getContext("2d")).Line({labels:labels,datasets:[{
		label: "Current Game Scores",
		fillColor: "rgba(220,220,220,0.2)",
		strokeColor: "rgba(220,220,220,1)",
		data: data1
	},
	{
		label: "Past Game Scores",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]});

var behaviorDiv=$('<div id="bot-intuition"><h4>Bot Intuition</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorDiv)
behaviorChart=new Chart($('#behavior-canvas').get(0).getContext("2d")).Doughnut(bot.considerations)

bot.onDeath=function(){
	
}

bot.onTick=function(){
	if(!(this.scoreHistory.length%10)){
		var j=0;
		for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
			scoreChart.datasets[0].points[j++].value=~~(this.scoreHistory[i]/100)	
		}

		j=0
		for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
			var gameStats=this.gameHistory[i];
			scoreChart.datasets[1].points[10*j++].value=~~(gameStats[2][gameStats[2].length-1]/100)	
		}
		scoreChart.update()
	}

	var needsUpdate=false
	for(var i=0;i<this.considerations.length;i++){
		if(behaviorChart.segments[i].value!=this.considerations[i].value){
			behaviorChart.segments[i].value=this.considerations[i].value
			needsUpdate=true
		}
	}
	if(needsUpdate){
		behaviorChart.update()
	}
}

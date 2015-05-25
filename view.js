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

var behaviorDiv=$('<div id="bot-intuition"><h4 id="bot-status">Intuition</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorDiv)
behaviorChart=new Chart($('#behavior-canvas').get(0).getContext("2d")).Doughnut(bot.considerations)

bot.onTick=function(){
	if(!((this.scoreHistory.length+1)%10)){
		var j=0;
		for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
			scoreChart.datasets[0].points[j++].value=~~(this.scoreHistory[i])	
		}

		j=0
		for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
			var gameStat=this.gameHistory[i];
			scoreChart.datasets[1].points[10*j++].value=~~(gameStat.maxSize)	
		}
		scoreChart.update()

		if(this.gameHistory.length<100) {
			$('#bot-status').html('<span style="color:red">LEARNING FOR 100 LIVES (life '+(this.gameHistory.length+1)+')</span>')
		}else if(this.gameHistory.length%2){
			$('#bot-status').html('<span style="color:red">LEARNING FOR 1 LIFE</span>')
		}else{
			$('#bot-status').html('Intuition')
		}
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

var heatMapDiv=$('<div id="heat-map-div"><canvas id="heat-map" width="175" height="175"></canvas></div>')
$('body').append(heatMapDiv)
var heatMapCtx=$('#heat-map').get(0).getContext("2d")

var miniMapCanvas=$('<canvas id="mini-map" width="175" height="175"></canvas>')
$('body').append(miniMapCanvas)
miniMapCtx=miniMapCanvas.get(0).getContext("2d")

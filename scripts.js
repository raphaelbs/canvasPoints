if(!window.$)
	window.$ = window.jQuery = require('jquery');

$(document).ready(function(){
	var rs = function(){
		$('#codigo').css('height', $('canvas').css('height'));
		$('#codigo').css('width', $('canvas').css('width'));
		$('#card').css('height', $('canvas').css('height'));
		$('#card').css('width', $('canvas').css('width'));
	};
	$(window).resize(rs);
	rs();
});

$('#api').click(function(){
	$('#card').toggleClass('flipped');
});

var editor = ace.edit("codigo");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

var pontos = ace.edit('pontos');
pontos.setTheme("ace/theme/xcode");
pontos.getSession().setMode("ace/mode/plain_text");


var btnNext = $('#next'), btnPrev = $('#prev'), btnReset = $('#reset'), btnCenter = $('#center'), span = $('#pontoslabel');
var taIt = 0, taLines = pontos.getValue().split('\n');

var resetfn = function(){
	taIt = 0;
	taLines = pontos.getValue().split('\n');
	pontos.selection.moveCursorToPosition({row: 0, column: 0});
	pontos.selection.selectLine();
	span.html('<span class="glyphicon glyphicon-chevron-right"></span> ');
	canvas.reset();
	fnResets();
};

var fnResets = function(){
	processandoPonto = undefined;
	points = undefined;
	events.reset();
	window.eval(editor.getValue());
};

btnNext.click(function(){
	if(taIt>=taLines.length)return;
	var pts = taLines[taIt++].split(' ');
	pontos.selection.moveCursorToPosition({row: taIt-1, column: 0});
	pontos.selection.selectLine();
	if(pts.length!=2) return;
	span.html('<span class="glyphicon glyphicon-chevron-right"></span> (' + pts[0] + ', ' + pts[1] + ')');
	events.call('next', function(err, fnNext){
		if(err) return console.error(err);
		canvas.next();
		fnNext(parseFloat(pts[0]), parseFloat(pts[1]));
	});
});

btnPrev.click(function(){
	var pts = taLines[--taIt].split(' ');
	pontos.selection.moveCursorToPosition({row: taIt-1, column: 0});
	pontos.selection.selectLine();
	if(pts.length!=2) return;
	span.html('<span class="glyphicon glyphicon-chevron-right"></span> (' + pts[0] + ', ' + pts[1] + ')');
	canvas.previous();
	events.call('previous', function(err, fnPrev){
		if(err) return console.error(err);
		canvas.next();
		fnPrev(parseFloat(pts[0]), parseFloat(pts[1]));
	});
});

canvas = function(canvas){
	var canvas = document.getElementById(canvas), ctx = canvas.getContext("2d");
	var objs = [], objPos = [];
	var scale = 1, originx = 0, originy = 0;

	// Zoom
	canvas.onmousewheel = function (event){
		var mousex = event.clientX - canvas.offsetLeft;
		var mousey = event.clientY - canvas.offsetTop;
		var wheel = event.wheelDelta/360;//n or -n

		var zoom = 1 + wheel/2;

		ctx.translate(
			originx,
			originy
		);
		ctx.scale(zoom,zoom);
		ctx.translate(
			-( mousex / scale + originx - mousex / ( scale * zoom ) ),
			-( mousey / scale + originy - mousey / ( scale * zoom ) )
		);

		originx = ( mousex / scale + originx - mousex / ( scale * zoom ) );
		originy = ( mousey / scale + originy - mousey / ( scale * zoom ) );
		scale *= zoom;
		invalidate();
	}

	// Pan
	var isDown = false, hasPos = false, startCoords = [];
	canvas.onmousedown = function(e) {
		isDown = true;
	};
	canvas.onmouseup   = function(e) {
		isDown = false;
		hasPos = false;
	};
	canvas.onmousemove = function(e){
		if(!isDown) return;
		if(!hasPos){
			startCoords[0] = e.offsetX;
			startCoords[1] = e.offsetY;
			hasPos = true;
		}else{
			var movx = (e.offsetX - startCoords[0]) / scale * 2;
			var movy = (e.offsetY - startCoords[1]) / scale * 2;
			ctx.translate(movx,movy);
			originx -= movx;
			originy -= movy;
			hasPos = false;
		}
		invalidate();
	}


	function line(x1, y1, x2, y2, color){
		this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; this.color = color || 'black';
	}
	function hline(y, color){
		this.y = y; this.color = color || 'black';
	}
	function vline(x, color){
		this.x = x; this.color = color || 'black';
	}
	function circle(x, y, radius, color){
		this.x = x; this.y = y; this.radius = radius; this.color = color || 'black';
	}
	function point(x, y){
		this.x = x; this.y = y; this.radius = 1; this.color = 'blue'; this.text = '(' + x + ', ' + y +')'
	}
	function invalidate(){
		ctx.fillStyle = "white";
		ctx.fillRect(originx,originy,canvas.width/scale,canvas.height/scale);
		for(var i=0; i<objs.length; i++){
			var obj = objs[i];
			if(obj instanceof vline){
				ctx.moveTo(obj.x, originy);
				ctx.lineTo(obj.x, originy + canvas.height/scale);
				if(obj.color) ctx.strokeStyle = obj.color;
				ctx.stroke();
				ctx.font = (30/scale) + "px Arial";
				ctx.fillStyle = "red";
				ctx.textAlign = "left";
				ctx.fillText('y', obj.x + 15/scale, originy + 30/scale);
			}
			if(obj instanceof hline){
				ctx.moveTo(originx, obj.y);
				ctx.lineTo(originx + canvas.width/scale, obj.y);
				if(obj.color) ctx.strokeStyle = obj.color;
				ctx.stroke();
				ctx.font = (30/scale) + "px Arial";
				ctx.fillStyle = "red";
				ctx.textAlign = "left";
				ctx.fillText('x', originx + 15/scale, obj.y + 30/scale);
			}
			if(obj instanceof line){
				ctx.moveTo(obj.x1, obj.y1);
				ctx.lineTo(obj.x2, obj.y2);
				if(obj.color) ctx.strokeStyle = obj.color;
				ctx.stroke();
			}
			if(obj instanceof circle){
				ctx.beginPath();
				ctx.arc(obj.x, obj.y, obj.radius, 0, 2*Math.PI);
				if(obj.color) ctx.strokeStyle = obj.color;
				ctx.stroke();
			}
			if(obj instanceof point){
				ctx.beginPath();
				ctx.arc(obj.x, obj.y, obj.radius, 0, 2*Math.PI);
				if(obj.color) ctx.strokeStyle = obj.color;
				ctx.stroke();
				ctx.font = "10px Arial";
				ctx.fillStyle = "red";
				ctx.textAlign = "left";
				ctx.fillText(obj.text, obj.x, obj.y + 10);
			}
		}
	}

	objs.push(new hline(0, '#898989')); // X axis
	objs.push(new vline(0, '#898989')); // Y axis
	objs.push(new circle(0, 0, 0, 'white'));
	invalidate();

	var retObj = {
		line : function(x1, y1, x2, y2, color){
			objs.push(new line(x1, y1, x2, y2, color));
			invalidate();
		},
		circle : function(x, y, radius, color){
			objs.push(new circle(x, y, radius, color));
			invalidate();
		},
		point : function(x, y){
			objs.push(new point(x, y));
			invalidate();
		},
		reset : function(){
			objs.length = 3;
			objPos.length = 0;
			invalidate();
		},
		center : function(x, y){
			if(!x || typeof x !== 'number') x = 0;
			if(!y) y = 0;
			ctx.translate(
				originx,
				originy
			);
			ctx.translate(
				(canvas.width/2)/scale - x,
				(canvas.height/2)/scale - y
			);
			originx = -(canvas.width/2)/scale +x;
			originy = -(canvas.height/2)/scale +y;
			invalidate();
		},
		next : function(){ objPos.push(objs.length); },
		previous : function(){ objs.length = objPos.pop(); invalidate(); }
	}
	retObj.center();
	return retObj;
}('visual');

var events = function(){
	var knowEvents = {next : 'function(x, y)', previous : 'function(x, y)'},
	evts = {};
	return{
		on : function(fn, callback){
			if(typeof fn !== 'string' || typeof callback !== 'function')
				return console.error('Parametros incorretos, informe events.on("functionName", function callback(){})');
			if(!knowEvents[fn]) return console.error('Evento desconhecido! Os eventos são: ' + knowEvents);
			if(!evts[fn])
				evts[fn] = [callback];
			else
				evts[fn].push(callback);
		},
		call : function(fn, callback){
			if(!knowEvents[fn]) return callback('Evento desconhecido! Os eventos são: ' + knowEvents);
			if(!evts[fn]) return callback('Callback do evento [' + fn + '] não declarado.\nAlgo está chamando este evento mas não há o que fazer..');

			for(var i=0; i<evts[fn].length; i++)
				return callback(null, evts[fn][i]);
		},
		reset : function(){
			for(var key in evts)
				evts[key] = null;
		}
	};
}();

editor.on("change", function(e){
	localStorage.code = editor.getValue();
});
localStorage.code && editor.setValue(localStorage.code);
pontos.on("change", resetfn);
btnReset.click(resetfn);
btnCenter.click(canvas.center);
eval(editor.getValue());

function initialState() {
	var cells = [0,0,0,0,0, 0,0,0,0];
	var pointer = Math.floor(cells.length / 2);
	return [cells, pointer];
}

function length(input) {
	var res = 0;
	var inComment = false;
	for (var i = 0; i < input.length; i++) {
		var c = input.charAt(i);
		if (inComment) {
			if (c == '\n') { inComment = false; }
		} else if (c == '#') { inComment = true;
		} else if ("+-<>[]".includes(c)) { res++; }
	}
	return res;
}

function processCode(input) {
	var interpretStart = performance.now();
	interpretCode(input);
	var interpretEnd = performance.now();
	console.log("interpret time:", interpretEnd - interpretStart);

	var interpret2Start = performance.now();
	console.profile('Hi');
	var [cells, pointer] = interpretCode2(input);
	// Fuck u firefox
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1173588
	setTimeout(() => console.profileEnd('Hi'), 10);
	var interpret2End = performance.now();
	console.log("interpret2 time:", interpret2End - interpret2Start);

// 	var jitStart = performance.now();
// 	var code = jitCode(input);
// 	var [cells, pointer] = new Function(code)();
// 	var jitEnd = performance.now();
// 	console.log(cells, pointer);
// 	console.log("jit time:", jitEnd - jitStart);

	return [cells, pointer];
}

function jitCode(input) {
	var inComment = false;

	var program = `
		var cells = [0,0,0,0,0, 0,0,0,0];
		var pointer = Math.floor(cells.length / 2);

		var print = (...a) => { $('#output').prepend('<br>' + a.join('')); }
		var numPrinted = 0;
		var limitPrint = (loc) => {
			numPrinted++;
			if (numPrinted <= 100) {
				print("Output (character ", loc, ", cell ", pointer, "): ", cells[pointer]);
			}
		};
		var printIfOutputIgnored = () => { if (numPrinted > 100) {
			print(numPrinted, " lines of output not shown"); }}
	`;
	for (var loc = 0; loc < input.length; loc++) {
// 		runtime++;
// 		if (runtime > 10000000) {
// 			printIfOutputIgnored();
// 			print("Runtime Limit Exceeded (", runtime, " steps)");
// 			return;
// 		}
		var c = input.charAt(loc);
		if (inComment) {
			if (c == '\n') inComment = false;
			continue;
		}
		switch (c) {
			case '#': inComment = true;                                   break;
			case '.': program += "limitPrint(" + loc + ");\n";            break;
			case '+': program += "cells[pointer]++;\n";                   break;
			case '-': program += "if (cells[pointer] > 0) cells[pointer]--;\n"; break;
			case '>': program += "if (pointer < cells.length-1) pointer++;\n"; break;
			case '<': program += "if (pointer > 0) pointer--;\n";         break;
			case '[': program += "do {\n";                                break;
			case ']': program += "} while (cells[pointer] > 0);\n";       break;
		}
	}
	program += `
		printIfOutputIgnored();
		print("You created <b>", cells[pointer],
		  "</b> using a total of <b>", `+length(input)+`, "</b> characters!");

		return [cells, pointer];
	`
	return program;
}

function interpretCode2(input) {
	var cells = [0,0,0,0,0, 0,0,0,0];
	var pointer = Math.floor(cells.length / 2);

	var print = (...a) => { $('#output').prepend('<br>' + a.join('')); }
	var runtime = 0;
	var stack = [];
	var numPrinted = 0;
	var printIfOutputIgnored = () => { if (numPrinted > 100) {
		print(numPrinted, " lines of output not shown"); }}
	var assert = (tru, ...a) => { if (!tru) { print("ASSERTION FAILED", a.join(', ')) } };

	var currentToken = '\n';
	var count = 0;

	input = input + '\n'; // Make sure we process the last character.

	for (var loc = 0; loc < input.length; loc++) {
		var c = input.charAt(loc);
		if (currentToken == '#') { // In comment
			if (c == '\n') currentToken = c;
			continue;
		}
		switch (currentToken) {
		case '.':
			numPrinted++;
			if (numPrinted <= 100) {
				print("Output (character ", loc, ", cell ", pointer, "): ", cells[pointer]);
			}
			currentToken = c;
			continue;
		case '[': stack.push(loc);
			currentToken = c;
			continue;
		case ']':
			if (stack.length == 0) {
				printIfOutputIgnored();
				print("Missing a \"[\"");
				return;
			}
			if (cells[pointer] > 0) loc = stack[stack.length - 1];
			else stack.pop();
			// We cannot use c here, it is stale since we may have jumped to
			// a new location.
			currentToken = input.charAt(loc);
			continue;

		case '>': if (pointer < cells.length - 1) pointer++; currentToken = c; continue;
		case '<': if (pointer > 0) pointer--; currentToken = c; continue;
		}
		if (currentToken == c) {
			count++;
			continue;
		}
		switch (currentToken) {
			case '+': cells[pointer] += count;                              break;
			case '-': cells[pointer] = Math.max(cells[pointer] - count, 0); break;
		}
		currentToken = c;
		count = 1;
	}
	printIfOutputIgnored();
	print("You created <b>", cells[pointer],
		  "</b> using a total of <b>", length(input), "</b> characters!");
	return [cells, pointer]
}

function interpretCode(input) {
	var cells = [0,0,0,0,0, 0,0,0,0];
	var pointer = Math.floor(cells.length / 2);

	var print = (...a) => { $('#output').prepend('<br>' + a.join('')); }
	var runtime = 0;
	var stack = [];
	var inComment = false;
	var numPrinted = 0;
	var printIfOutputIgnored = () => { if (numPrinted > 100) {
		print(numPrinted, " lines of output not shown"); }}
	for (var loc = 0; loc < input.length; loc++) {
// 		runtime++;
// 		if (runtime > 10000000) {
// 			printIfOutputIgnored();
// 			print("Runtime Limit Exceeded (", runtime, " steps)");
// 			return;
// 		}
		var c = input.charAt(loc);
		if (inComment) {
			if (c == '\n') inComment = false;
			continue;
		}
		switch (c) {
			case '#': inComment = true;                                   break;
			case '.':
				numPrinted++;
				if (numPrinted <= 100) {
					print("Output (character ", loc, ", cell ", pointer, "): ", cells[pointer]);
				}
				                                                          break;
			case '+': cells[pointer]++;                                   break;
			case '-': if (cells[pointer] > 0) cells[pointer]--;           break;
			case '>': if (pointer < cells.length-1) pointer++;            break;
			case '<': if (pointer > 0) pointer--;                         break;
			case '[': stack.push(loc);                                    break;
			case ']':
				if (stack.length == 0) {
					printIfOutputIgnored();
					print("Missing a \"[\"");
					return;
				}
				if (cells[pointer] > 0) loc = stack[stack.length - 1];
				else stack.pop();
				                                                          break;
		}
	}
	printIfOutputIgnored();
	print("You created <b>", cells[pointer],
		  "</b> using a total of <b>", length(input), "</b> characters!");
	return [cells, pointer]
}

$(document).ready(function(){
	var [cells, pointer] = initialState();
	function displayCells() {
		console.log("display", cells, pointer);
		for(var i = 0; i < cells.length; i++) {
			$("#cell"+i).text(cells[i]);
			$("td").removeClass("selected");
			$("#cell"+pointer).addClass("selected");
		}
	}

	for(var i = 0; i < cells.length; i++) {
		var html = $("<td></td>");
		html.attr("id","cell"+i)
		
		$("#row").append(html);
	}
	cells, pointer = initialState();
	displayCells();
	$("#clear").click(function() {
		cells, pointer = initialState();
		displayCells();
		$('#output').html('');
	});

	$("#execute").click( function() {
		[cells, pointer] = initialState();
		[cells, pointer] = processCode($("#code").val());
		console.log(cells, pointer);
		displayCells();
	});

	code.addEventListener('input', (ev) => {
		$('#chars').html(length(code.value));
	});
});

#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <assert.h>
#define LEN(x)  (sizeof(x) / sizeof((x)[0]))

typedef struct {
	int elem[10];
	int len;
} stack;

void stack_push(stack* s, int loc) {
	assert(s->len < 10);
	s->elem[s->len] = loc;
	s->len++;
}

int stack_pop(stack* s) {
	assert(s->len > 0);
	s->len--;
	return s->elem[s->len];
}

bool program_valid(const char *prog) {
	int balance = 0;
	for (int i = 0; prog[i] != '\0'; i++) {
		if (prog[i] == '[') balance++;
		if (prog[i] == ']') balance--;
		if (balance < 0) return false;
	}
	return true;
}

int interpret(const char *prog) {
	if (!program_valid(prog)) {
		return -1;
	}
	int runtime = 0;
	stack s = {};
	int cells[9] = {};
	int ncells = 9;
	int pointer = 4;
	for (int i = 0; prog[i] != '\0'; i++) {
		runtime++;
		if (runtime > 1000) {
			return -2;
		}
		switch (prog[i]) {
			case '+': cells[pointer]++; break;
			case '-': if (cells[pointer] > 0) cells[pointer]--; break;
			case '>': if (pointer < ncells - 1) pointer++; break;
			case '<': if (pointer > 0) pointer--; break;
			case '[': stack_push(&s, i); break;
			case ']': {
				int prev = stack_pop(&s);
				if (cells[pointer] > 0) {
					i = prev;
					stack_push(&s, i);
				}
				break;
			}
		}
	}
	return cells[pointer];
}

typedef struct {
	const char *prog;
	int res;
} test;

test tests[] = {
	{"", 0},
	{"+", 1},
	{"++", 2},
	{"[", 0},
	{"]", -1},
	{"[+]", -2},
	{"++[>++<-]>", 4},
};

bool inc_digit(char* prog, int d) {
	switch (prog[d]) {
		case '+': prog[d] = '-'; break;
		case '-': prog[d] = '<'; break;
		case '<': prog[d] = '>'; break;
		case '>': prog[d] = '['; break;
		case '[': prog[d] = ']'; break;
		case ']': prog[d] = '+'; return true;
	}
	return false;
}
bool next_prog(char* prog) {
	bool chain = true;
	int digit = 9;
	while (chain && digit >= 0) {
		chain = inc_digit(prog, digit);
		digit--;
	}
	return chain;
}

int main() {
	printf("Basic test %d\n", interpret("++"));
	for (int i = 0; i < LEN(tests); i++) {
		printf("Test %d ('%s'): %d, expected %d\n", i, tests[i].prog,
			   interpret(tests[i].prog), tests[i].res);
	}
	char prog[10] = "++++++++++";
	bool chain = false;
	int i = 0;
	while (!chain) {
		int res = interpret(prog);
		if (res >= 10) {
			printf("PROMISING: prog %s, %d\n", prog, res);
		}
		if ((i & 0xFFFF) == 0) {
			printf("Iteration %d...\n", i);
		}
		chain = next_prog(prog);
		i++;
	}
}

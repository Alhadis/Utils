/**
 * Generate integer lists for testing byte-conversion
 * functions. Somewhat over-the-top, but whatever.
 */
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

#define write(i) printf(format, i)
#define HEADER "export default {\n"
#define FOOTER "};\n"
#define MAX 1024

void usage(){
	fprintf(stderr, "usage: write-ints [8|16|32|64]\n");
	exit(1);
}

void writeInt8(){
	printf(HEADER);
	const char *format = "\t0x%1$.2hhX: %1$d,\n";
	for(int8_t i = INT8_MIN; i < INT8_MAX; write(i++));
	write(INT8_MAX);
	printf(FOOTER);
}

void writeInt16(){
	printf(HEADER);
	const char *format = "\t0x%1$.4hX: %1$d,\n";
	int16_t num = INT16_MIN;
	write(num);
	while(num++ != INT16_MAX) write(num);
	printf(FOOTER);
}

void writeInt32(){
	printf(HEADER);
	const char *format = "\t0x%1$.8X: %1$d,\n";
	for(int32_t i = INT32_MIN; i < INT32_MIN + MAX; write(i++));
	for(int32_t i = -MAX; i < MAX; write(i++));
	for(int32_t i = INT32_MAX - MAX; i < INT32_MAX; write(i++));
	write(INT32_MAX);
	printf(FOOTER);
}

void writeInt64(){
	printf(HEADER);
	const char *format = "\t[0x%1$llXn]: %1$lldn,\n";
	for(int64_t i = INT64_MIN; i < INT64_MIN + MAX; write(i++));
	for(int64_t i = -MAX; i < MAX; write(i++));
	for(int64_t i = INT64_MAX - MAX; i < INT64_MAX; write(i++));
	write(INT64_MAX);
	printf(FOOTER);
}

int main(int argc, char const *argv[]){
	if(argc < 2) usage();
	
	int size = atoi(*++argv);
	switch(size){
		case 8:  writeInt8();  break;
		case 16: writeInt16(); break;
		case 32: writeInt32(); break;
		case 64: writeInt64(); break;
		default: usage();
	}
	return 0;
}

function generate_test() {
    let sum = this.thread.y * this.thread.x + 1;
    return sum;
}

const g_test = gpu.createKernel(generate_test).setPipeline(true).setOutput([256, 256]);

function mutate_test(t) {
    let sum = Math.sqrt(t[this.thread.x][this.thread.y]);
    t[this.thread.x][this.thread.y] = Math.sqrt(t[this.thread.x][this.thread.y]);
    return sum;
}

const m_test = gpu.createKernel(mutate_test).setPipeline(true).setOutput([256, 256]);

var g_textur;

function g_test_time() {
    var startTime = performance.now();
    
    g_textur = g_test();
    
    var endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms
    
    console.log(timeDiff);
}

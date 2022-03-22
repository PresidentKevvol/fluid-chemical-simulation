function draw_on_canvas_krnl(f, maxval) {
    var i = this.thread.y;
    var j = this.thread.x;
    
    var v = f[i][j];
    v = value_mapping(v, maxval);
    
    this.color(0, 0, v/maxval, 1);
}

gpu.addFunction(value_mapping);

const gpu_draw_on_canvas = gpu.createKernel(draw_on_canvas_krnl, {
  output: [sim_grid_width, sim_grid_height],
}).setGraphical(true);

function draw_on_canvas_multi_krnl(fa,fb, fc, maxval) {
    var i = this.thread.y;
    var j = this.thread.x;
    
    var va = fa[i][j];
    var vb = fb[i][j];
    var vc = fc[i][j];

    va = value_mapping(va, maxval);
    vb = value_mapping(vb, maxval);
    vc = value_mapping(vc, maxval);

    
    this.color(va/maxval, vb/maxval, vc/maxval, 1);
}

const gpu_draw_on_canvas_multi = gpu.createKernel(draw_on_canvas_multi_krnl, {
  output: [sim_grid_width, sim_grid_height],
}).setGraphical(true);


const gpu_draw_canvas = gpu_draw_on_canvas_multi.canvas;


function draw_on_canvas_krnl_t(f, maxval) {
    var i = this.thread.y;
    var j = this.thread.x;
    
    var v = f[i][j];
    v = value_mapping(v, maxval);
    
    return v/maxval;
}
const gpu_draw_on_canvas_t = gpu.createKernel(draw_on_canvas_krnl_t, {
  output: [sim_grid_width, sim_grid_height],
});

const dpu = new GPU({ mode: 'dev' });
const gpu_draw_on_canvas_d = dpu.createKernel(draw_on_canvas_krnl_t, {
  output: [sim_grid_width, sim_grid_height],
});
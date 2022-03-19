//function to draw field on the canvas
function draw_on_canvas(f, vas_ctx, maxval) {
    var imd = vas_ctx.createImageData(sim_grid_width, sim_grid_height);
    var idx = 0;
    var i,j;
    for (j=0; j<sim_grid_height; j++) {
        for (i=0; i<sim_grid_width; i++) {
            var v = f[i][j];
            if (v !== 0) {
                v = Math.log(v) + 5;
                v = (v > maxval) ? maxval : v;
                v = (v < 0) ? 0 : v;
            } else {
                v = 0;
            }
                        
            imd.data[idx] = 0;
            imd.data[idx + 1] = 0;
            imd.data[idx + 2] = 255;
            imd.data[idx + 3] = v / maxval * 255;
            
            idx += 4;
        }
    }
    //draw on destination canvas
    vas_ctx.putImageData(imd, 0, 0);
}

function value_mapping(x, maxval) {
    var v = x;
    if (v !== 0) {
        v = Math.log(v) + 5;
        v = (v > maxval) ? maxval : v;
        v = (v < 0) ? 0 : v;
    } else {
        v = 0;
    }
    return v;
}

//draw multiple substances' density on canvas
//the chemical reaction goes:
//A(red) + B(blue) -> C(green)
function draw_on_canvas_multi(fa, fb, fc, vas_ctx, maxval) {
    var imd = vas_ctx.createImageData(sim_grid_width, sim_grid_height);
    var idx = 0;
    var i,j, va, vb, vc;
    for (j=0; j<sim_grid_height; j++) {
        for (i=0; i<sim_grid_width; i++) {
            va = value_mapping(fa[i][j], maxval);
            vb = value_mapping(fb[i][j], maxval);
            vc = value_mapping(fc[i][j], maxval);

                        
            imd.data[idx]     = va / maxval * 255;
            imd.data[idx + 1] = vc / maxval * 255;
            imd.data[idx + 2] = vb / maxval * 255;
            imd.data[idx + 3] = 255;
            
            idx += 4;
        }
    }
    //draw on destination canvas
    vas_ctx.putImageData(imd, 0, 0);
}
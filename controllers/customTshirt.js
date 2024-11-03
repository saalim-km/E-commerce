const loadCustomPage = async(req,res)=> {
    try {
        res.render("custom")
    } catch (error) {
        console.log("error in custompage",error.message);
    }
}

const designPage = async(req,res)=> {
    try {
        const {color} = req.query;
        console.log(color)
        let tshirtImageUrl;
        if(color == 'white'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730554192/https___d1e00ek4ebabms.cloudfront.net_production_bb4d4c4d-3305-40a8-9e93-fdd595ec583e_ttr2zh.avif';
        }else if(color == 'black'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730554174/black_q0cwba.png';
        }else if(color == 'blue'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730561154/blue_vep21i.png';
        }else if(color == 'green'){
            tshirtImageUrl = 'https://res.cloudinary.com/deh2nuqeb/image/upload/v1730561154/green_bx8ypb.png';
        }
        res.render("design",{tshirtImageUrl});
    } catch (error) {
        console.log("error in designPage",error.message);
    }
}
module.exports = {
    loadCustomPage,
    designPage
}
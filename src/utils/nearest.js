const getDistance = require('./distance')

let dist = {}
const nearestFirst = (Lat,Long,Data) =>{
    for(i = 0;i < Data.length;i++){
        let tempDistance = getDistance(Lat,Long,Data[i].latitude,Data[i].longitude)
        dist[Data[i].name] = tempDistance
    }
    var items = Object.keys(dist).map(
        (key) => { return [key, dist[key]] }); 

    items.sort(
        (first, second) => { return first[1] - second[1] }
      );
       
    var keys = items.map(
        (e) => { return e[0] });
    var fdist = items.map(
        (e) => { return e[1]});
    dist = {}
    return {keys,fdist}
}


module.exports = nearestFirst
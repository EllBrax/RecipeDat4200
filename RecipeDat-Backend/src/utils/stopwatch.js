export function startStopwatch(label ='AI Generation') {
    const start = Date.now();

    process.stdout.write('${label}: 0.0s');
    
    const timer = setInterval(() => {
        const elapsedMs = Date.now() - start;
        const elapsedSec = (elapsedMs / 1000).toFixed(1);
        
        process.stdout.write('\r${label}: ${elapsedSec}s');

    }, 100);

    return function stop() {
        clearInterval(timer);
        const totalSec = ((Date.now() - start) /1000).toFixed(1);

        process.stdout.write('\r${label}: done in ${totalSec}s\n');

        return totalSec;
    };

}
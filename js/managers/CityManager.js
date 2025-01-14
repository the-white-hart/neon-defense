class CityManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.cities = [];
        this.cityImages = [];
        this.loadCityImages();
        this.initializeCities();
    }

    loadCityImages() {
        for (let i = 1; i <= 6; i++) {
            const img = new Image();
            img.src = `./assets/images/cities/00${i}-${i === 1 ? 'buildings' : 
                                                i === 2 ? 'architecture-and-city' :
                                                i === 3 ? 'cityscape' :
                                                i === 4 ? 'smart-city' :
                                                i === 5 ? 'skyscraper' : 'green-city'}.png`;
            this.cityImages.push(img);
        }
    }

    initializeCities() {
        const spacing = this.ctx.canvas.width / 7;
        this.cities = [];
        
        for (let i = 0; i < 6; i++) {
            this.cities.push({
                x: spacing * (i + 1),
                y: this.ctx.canvas.height - 30,
                health: 100,
                destroyed: false,
                damaged: false
            });
        }
    }

    render() {
        for (let i = 0; i < this.cities.length; i++) {
            const city = this.cities[i];
            if (!city.destroyed) {
                // Draw city image
                const cityImage = this.cityImages[i];
                if (cityImage && cityImage.complete) {
                    this.ctx.save();
                    this.ctx.shadowColor = '#0ff';
                    this.ctx.shadowBlur = 10;
                    this.ctx.drawImage(cityImage, city.x - 30, city.y - 60, 60, 60);
                    this.ctx.restore();
                }

                // Draw health bar
                const healthBarWidth = 60;
                const healthBarHeight = 4;
                const healthBarY = city.y - 80;
                
                // Draw background (red portion)
                this.ctx.fillStyle = '#f00';
                this.ctx.fillRect(
                    city.x - healthBarWidth/2,
                    healthBarY,
                    healthBarWidth,
                    healthBarHeight
                );
                
                // Draw remaining health (green portion)
                this.ctx.fillStyle = '#0f0';
                this.ctx.fillRect(
                    city.x - healthBarWidth/2,
                    healthBarY,
                    (city.health/100) * healthBarWidth,
                    healthBarHeight
                );
            }
        }
    }

    getAliveCityCount() {
        return this.cities.filter(city => !city.destroyed).length;
    }

    deployReserveCity() {
        for (let i = 0; i < this.cities.length; i++) {
            if (this.cities[i].destroyed) {
                this.cities[i].destroyed = false;
                this.cities[i].health = 100;
                this.cities[i].damaged = false;
                break;
            }
        }
    }

    reset() {
        this.initializeCities();
    }
}

export default CityManager;

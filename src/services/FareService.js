const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const normParams = require('../fare_model/normalization_params.json')

class FareService {

    async getFare(distance, passengerType, fuelPrice) {
        const distanceNormalized = (distance - normParams.mean_X.Distance) / normParams.std_X.Distance;

        const typeNormalized = [
            ((passengerType === 'Elderly' ? 1 : 0) - normParams.mean_X.Type_Elderly) / normParams.std_X.Type_Elderly,
            ((passengerType === 'General' ? 1 : 0) - normParams.mean_X.Type_General) / normParams.std_X.Type_General,
            ((passengerType === 'Student' ? 1 : 0) - normParams.mean_X.Type_Student) / normParams.std_X.Type_Student,
        ];

        const fuelPriceNormalized = (fuelPrice - normParams.mean_X.BBM) / normParams.std_X.BBM;
        const fuelDistance = fuelPrice * distance
        const fuelDistanceNormalized = (fuelDistance - normParams.mean_X.Distance_BBM) / normParams.std_X.Distance_BBM;

        const modelPath = path.join(__dirname, '..', 'fare_model', 'model.json');
        const model = await tf.loadLayersModel(`file://${modelPath}`);

        const input = tf.tensor2d(
            [[distanceNormalized, fuelPriceNormalized, fuelDistanceNormalized, ...typeNormalized]],
            [1, 3 + typeNormalized.length]
        );
        const result = model.predict(input);

        const resultDenormalized = tf.add(tf.mul(result, normParams.std_y), normParams.mean_y);

        const resultValues = resultDenormalized.dataSync();

        const roundedValues = resultValues.map(value => Math.round(value / 1000) * 1000);

        return roundedValues[0];
    }

}

module.exports = FareService
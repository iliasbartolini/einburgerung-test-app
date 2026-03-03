import { ImageSourcePropType } from 'react-native';

// React Native requires static require() calls for bundled images.
// This map provides the static require for each question that has an image.
const QUESTION_IMAGES: Record<number, ImageSourcePropType> = {
  // General questions
  21: require('../../assets/images/questions/21.png'),
  55: require('../../assets/images/questions/55.png'),
  70: require('../../assets/images/questions/70.png'),
  130: require('../../assets/images/questions/130.png'),
  176: require('../../assets/images/questions/176.png'),
  181: require('../../assets/images/questions/181.png'),
  187: require('../../assets/images/questions/187.png'),
  209: require('../../assets/images/questions/209.png'),
  216: require('../../assets/images/questions/216.png'),
  226: require('../../assets/images/questions/226.png'),
  // Baden-Württemberg
  301: require('../../assets/images/questions/301.png'),
  308: require('../../assets/images/questions/308.png'),
  // Bayern
  311: require('../../assets/images/questions/311.png'),
  318: require('../../assets/images/questions/318.png'),
  // Berlin
  321: require('../../assets/images/questions/321.png'),
  328: require('../../assets/images/questions/328.png'),
  // Brandenburg
  331: require('../../assets/images/questions/331.png'),
  338: require('../../assets/images/questions/338.png'),
  // Bremen
  341: require('../../assets/images/questions/341.png'),
  348: require('../../assets/images/questions/348.png'),
  // Hamburg
  351: require('../../assets/images/questions/351.png'),
  358: require('../../assets/images/questions/358.png'),
  // Hessen
  361: require('../../assets/images/questions/361.png'),
  368: require('../../assets/images/questions/368.png'),
  // Mecklenburg-Vorpommern
  371: require('../../assets/images/questions/371.png'),
  378: require('../../assets/images/questions/378.png'),
  // Niedersachsen
  381: require('../../assets/images/questions/381.png'),
  388: require('../../assets/images/questions/388.png'),
  // Nordrhein-Westfalen
  391: require('../../assets/images/questions/391.png'),
  398: require('../../assets/images/questions/398.png'),
  // Rheinland-Pfalz
  401: require('../../assets/images/questions/401.png'),
  408: require('../../assets/images/questions/408.png'),
  // Saarland
  411: require('../../assets/images/questions/411.png'),
  418: require('../../assets/images/questions/418.png'),
  // Sachsen
  421: require('../../assets/images/questions/421.png'),
  428: require('../../assets/images/questions/428.png'),
  // Sachsen-Anhalt
  431: require('../../assets/images/questions/431.png'),
  438: require('../../assets/images/questions/438.png'),
  // Schleswig-Holstein
  441: require('../../assets/images/questions/441.png'),
  448: require('../../assets/images/questions/448.png'),
  // Thüringen
  451: require('../../assets/images/questions/451.png'),
  458: require('../../assets/images/questions/458.png'),
};

export function getQuestionImage(questionId: number): ImageSourcePropType | null {
  return QUESTION_IMAGES[questionId] ?? null;
}

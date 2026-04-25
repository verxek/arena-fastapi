import { MdEdit, MdDelete, MdOutlineDataArray } from "react-icons/md";
import { BiMath, BiPyramid, BiLogoFlickr } from "react-icons/bi";
import { LuSearchCode, LuCombine,LuDices } from "react-icons/lu";
import { GoNumber } from "react-icons/go";
import { TbMatrix, TbLambda  } from "react-icons/tb";
import { BsArrowRepeat, BsBoxes, BsAlphabet, BsEmojiSmile, BsBorderAll, BsEmojiLaughing, BsEmojiNeutral, BsEmojiAstonished, BsEmojiDizzy } from "react-icons/bs";
import { FaSort } from "react-icons/fa";
import { PiGraphBold } from "react-icons/pi";

export const categoryIcons = {
  "Арифметика": <BiMath />,
  "Геометрия": <BiPyramid /> ,
  "Строки": <BsAlphabet />,
  "Массивы": <MdOutlineDataArray />,
  "Поиск": <LuSearchCode />,
  "Теория чисел": <GoNumber />,
  "Комбинаторика": <LuCombine />,
  "Матрицы": <TbMatrix />,
  "Вероятность": <LuDices />,
  "Жадные алгоритмы": <BsBoxes />,
  "Сортировка": <FaSort />,
  "Графы": <PiGraphBold />,
  "Рекурсия": <BsArrowRepeat />,
  "Регулярные выражения": <TbLambda />,
  "Прочее" : <BiLogoFlickr />
};


export const difficultyIcons = {
  "Легкий": <BsEmojiLaughing />,
  "Средний": <BsEmojiSmile />,
  "Выше среднего": <BsEmojiNeutral />,
  "Сложный": <BsEmojiAstonished />,
  "Очень сложный": <BsEmojiDizzy />
};
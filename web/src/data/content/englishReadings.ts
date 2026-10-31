// 英语短文阅读（docs/06 §3.13）：每课一篇 ~60 词小短文，尽量复用截至该课的
// 已学词汇与句型，配套 2 道理解题（中文题干，考理解不考读题）。
// 主线人物：Ben 与家人、小猫、同学 Lily。若与纸质课本有出入，以课本为准；
// 短文文本由内容校对维护（web/tests/readingContent.test.ts 钉死词量与复用率）。
import type { LessonReading } from '../types';

export const englishReadings: Record<string, LessonReading> = {
  "en-u1-l1": {
    title: "Ben's Morning",
    text: "Good morning, Ben! Look at the clock. What time is it? It is seven o'clock. Ben says, 'Good morning, Mum!' Mum says, 'Look at the time. It is seven o'clock in the morning.' Ben says, 'I can see the clock. It is a nice clock.' Now it is eight o'clock. The clock is happy too. Ben says, 'What a nice morning!'",
    questions: [
      { q: "早上几点了？", options: ["七点", "八点", "九点"], answer: 0 },
      { q: "Ben 看到了什么？", options: ["A clock", "A dog", "A bird"], answer: 0 },
    ],
  },
  "en-u1-l2": {
    title: "Time for Bed",
    text: "Ben is at home. It is nine o'clock at night. Mum says, 'Ben, it is time for bed. Please go to bed early.' Ben says, 'Mum, I am not late for school.' Mum says, 'Early is good, late is not good. We talk about time, Ben.' Ben says, 'OK, Mum. Good night!' In the morning, Ben is not late. He is happy.",
    questions: [
      { q: "晚上几点了？", options: ["九点", "七点", "八点"], answer: 0 },
      { q: "妈妈对 Ben 说了什么？", options: ["Please go to bed early", "Please go home", "Please talk"], answer: 0 },
    ],
  },
  "en-u1-l3": {
    title: "A Happy Sunday",
    text: "It is Sunday. Ben is happy. It is eleven o'clock. Ben says, 'It is time to play!' He can swim. He can play with his ball. The clock has twelve numbers. At twelve o'clock, Ben is at home. 'I get up at seven and play all day,' he says. 'I am a happy boy!'",
    questions: [
      { q: "今天星期几？", options: ["Sunday", "Monday", "Friday"], answer: 0 },
      { q: "Ben 会做什么？", options: ["He can swim", "He can fly", "He can talk"], answer: 0 },
    ],
  },
  "en-u2-l1": {
    title: "How Do You Go to School?",
    text: "How do you go to school? Ben goes to school by bus. Lily goes to school by bike. Ann walks to school. Her school is not far. Ben says, 'I like the bus. I sit and look out.' Lily says, 'I like my bike. It is small but fast.' This is my school. We are happy at school.",
    questions: [
      { q: "Ben 怎么去学校？", options: ["By bus", "By bike", "He walks"], answer: 0 },
      { q: "Lily 的自行车是什么样的？", options: ["Small but fast", "Big and red", "Old and slow"], answer: 0 },
    ],
  },
  "en-u2-l2": {
    title: "On an Elephant",
    text: "Today Ben goes to school on an elephant! He sits on the elephant. The elephant is big and slow. Ben is not late today. 'Good morning, Miss Ma!' he says. 'Good morning, Ben! You are on an elephant today!' says Miss Ma. 'Yes! I am not late. The elephant is my bus today!' Ben is happy.",
    questions: [
      { q: "Ben 今天怎么去学校？", options: ["On an elephant", "By bus", "By bike"], answer: 0 },
      { q: "Ben 迟到了吗？", options: ["No, he is not late", "Yes, he is late", "He is at home"], answer: 0 },
    ],
  },
  "en-u2-l3": {
    title: "A Mouse in the House",
    text: "Ben lives in a small town. His house is not big. How do you go to the park? Ben goes to the park by bike. In the park he sees a zoo bus. Today a mouse is in Ben's house! 'How do you go home, little mouse?' says Ben. 'Go to the park! The park is good for you.'",
    questions: [
      { q: "谁在 Ben 家里？", options: ["A mouse", "A cat", "An elephant"], answer: 0 },
      { q: "Ben 让小老鼠去哪里？", options: ["To the park", "To school", "To the zoo"], answer: 0 },
    ],
  },
  "en-u3-l1": {
    title: "Sports Are Fun",
    text: "Ben likes sport. He plays football after school. Lily plays basketball well. We play ping-pong at school. Sports are fun! Ben says, 'I like football. I play it every day.' Lily says, 'I like basketball. Let's play together!' Football, basketball, ping-pong — they are all fun. Sport is good for you and me.",
    questions: [
      { q: "Ben 放学后做什么？", options: ["He plays football", "He plays basketball", "He plays ping-pong"], answer: 0 },
      { q: "Lily 擅长什么？", options: ["She plays basketball well", "She swims well", "She draws well"], answer: 0 },
    ],
  },
  "en-u3-l2": {
    title: "A Super Player",
    text: "Ben is a super player. He can jump high. He can run fast. He can catch the ball. 'Catch the ball, Ben!' says Lily. Ben jumps high and catches it. 'You are a good player!' says Lily. 'Let's play together!' They play ping-pong and basketball. The bird flies high in the sky. Ben and Lily are happy.",
    questions: [
      { q: "Ben 会做什么？", options: ["He can jump high and run fast", "He can fly", "He can swim fast"], answer: 0 },
      { q: "Lily 说了什么？", options: ["You are a good player", "You are late", "Go home now"], answer: 0 },
    ],
  },
  "en-u3-l3": {
    title: "Jump Rope",
    text: "Ben jumps rope on Monday. He jumps rope on Wednesday too. His rope is long. Lily has a big ball. The cat is small. Ben's dad is very tall. 'I like basketball best,' says Ben. 'I can run fast and jump high. My dad is tall. He can catch the ball too!' Sport is fun for Ben and his dad.",
    questions: [
      { q: "Ben 什么时候跳绳？", options: ["On Monday and Wednesday", "On Sunday", "At nine o'clock"], answer: 0 },
      { q: "Ben 的爸爸是什么样的？", options: ["Very tall", "Very small", "Very late"], answer: 0 },
    ],
  },
  "en-u4-l1": {
    title: "What Day Is It Today?",
    text: "'What day is it today?' asks Ben. 'It is Sunday today!' says Lily. 'We go to school on Monday. We go to school on Tuesday, Wednesday, Thursday and Friday.' 'I play football on Friday,' says Ben. 'And on Saturday we play at home. What a nice week!' Seven days, one week. Every day is a good day.",
    questions: [
      { q: "今天星期几？", options: ["Sunday", "Monday", "Friday"], answer: 0 },
      { q: "Ben 星期五做什么？", options: ["He plays football", "He jumps rope", "He goes to the zoo"], answer: 0 },
    ],
  },
  "en-u4-l2": {
    title: "A House for the Dog",
    text: "Ben gets a little dog. The dog is little and white. 'I draw a picture of my dog,' says Ben. 'We build a house for the dog.' Dad paints the house. It is a good house. The house is for the little dog. The dog is happy in its new house. Ben and the dog play every day.",
    questions: [
      { q: "Ben 得到了什么？", options: ["A little dog", "A big cat", "A bird"], answer: 0 },
      { q: "谁给狗屋刷漆？", options: ["Dad", "Lily", "Miss Ma"], answer: 0 },
    ],
  },
  "en-u4-l3": {
    title: "A Card for Mum",
    text: "On Saturday Ben plays at home. On Sunday the family goes to the park. 'I am happy at the weekend!' says Ben. Ben makes a card for Mum. 'Let's make a card together!' he says. Lily is Ben's good friend. She makes a card too. The cards are for Mum and Dad. What a nice weekend!",
    questions: [
      { q: "Ben 给谁做卡片？", options: ["Mum and Dad", "Lily", "The dog"], answer: 0 },
      { q: "周末 Ben 心情如何？", options: ["He is happy", "He is late", "He is small"], answer: 0 },
    ],
  },
  "en-u5-l1": {
    title: "My Happy Weekend",
    text: "'What do you do on the weekend?' asks Ben. 'I read books on Sunday. I clean my room on Saturday.' My room is small but nice. Dad cooks noodles for me. Yum! I write a card for my teacher. Ben reads, cleans and writes. He is happy at the weekend. What do you do? Read, clean, cook, write — weekend is fun!",
    questions: [
      { q: "Ben 周日做什么？", options: ["He reads books", "He goes to school", "He swims"], answer: 0 },
      { q: "谁煮了面条？", options: ["Dad", "Mum", "Lily"], answer: 0 },
    ],
  },
  "en-u5-l2": {
    title: "Sunday Is a Big Day",
    text: "Today is a big day. It is Lily's birthday! 'Happy birthday to you!' says Ben. Lily is happy. Ben reads books to his sister. Mum and Dad are here. My family is here. We eat a big birthday cake. The cake is for Lily. 'Happy birthday, Lily! Let's eat the big cake together!' What a big day!",
    questions: [
      { q: "今天是谁的生日？", options: ["Lily's", "Ben's", "Mum's"], answer: 0 },
      { q: "他们吃了什么？", options: ["A big cake", "Noodles", "Ice cream"], answer: 0 },
    ],
  },
  "en-u5-l3": {
    title: "Shopping with Mum",
    text: "I go shopping with Mum. We often go shopping on Saturday. Mum cooks noodles at home. I draw a picture for Dad. We play games at school. I walk with Dad in the park. Weekend is fun: shopping, games, pictures and noodles! What do you do at the weekend? I play and I am happy.",
    questions: [
      { q: "Ben 和谁去购物？", options: ["Mum", "Dad", "Lily"], answer: 0 },
      { q: "Ben 画了什么？", options: ["A picture", "A card", "A house"], answer: 0 },
    ],
  },
  "en-u6-l1": {
    title: "The Animals in a Park",
    text: "What animal is this? It's a white rabbit. The duck is yellow. I can see a bird in the tree. The cat can walk fast. A dog is in the park too. The rabbit, the duck, the bird, the cat and the dog — they are all in the park. What animals can you see? Animals are fun!",
    questions: [
      { q: "兔子是什么颜色的？", options: ["White", "Yellow", "Black"], answer: 0 },
      { q: "猫能怎么样？", options: ["It can walk fast", "It can fly", "It can talk"], answer: 0 },
    ],
  },
  "en-u6-l2": {
    title: "A Fun Race",
    text: "The monkey has long arms. The tiger can run fast. The panda is black and white. The elephant has a long nose and strong legs. The monkey can climb high. They run in the park. 'A fun race!' says Ben. Who can run fast? The tiger! Who can climb high? The monkey! Animals are strong and fun.",
    questions: [
      { q: "谁跑得快？", options: ["The tiger", "The monkey", "The panda"], answer: 0 },
      { q: "大象的鼻子是什么样的？", options: ["Long", "Small", "White"], answer: 0 },
    ],
  },
  "en-u6-l3": {
    title: "Animals Can Do It",
    text: "What animal is this? It's a green frog. What animal is that? That is a fish. The fish can swim. The bird can fly. The frog can swim too! The frog is small but it can jump. Animals can do many things. I can run and jump. You can read and write. We are all super!",
    questions: [
      { q: "青蛙是什么颜色的？", options: ["Green", "White", "Black"], answer: 0 },
      { q: "鱼会做什么？", options: ["It can swim", "It can fly", "It can talk"], answer: 0 },
    ],
  },
  "e2s-u1-l1": {
    title: "Spring Is Here",
    text: "Spring is here! In spring we fly kites. It is warm in spring. The flowers are beautiful. The grass is green. The trees are tall. Ben and Lily fly kites in the park. 'Look at my kite!' says Ben. 'It is high in the sky!' Spring is warm and beautiful. I like spring.",
    questions: [
      { q: "春天天气怎么样？", options: ["Warm", "Hot", "Cold"], answer: 0 },
      { q: "草是什么颜色的？", options: ["Green", "Yellow", "White"], answer: 0 },
    ],
  },
  "e2s-u1-l2": {
    title: "Hot Summer",
    text: "In summer we swim. It is hot in summer. The sun is bright. 'Can you swim?' asks Ben. 'Yes, I can swim in the water!' I like ice cream. Ice cream is good in summer. Ben, Lily and the sun — summer is hot but fun. Swim, ice cream and the bright sun. I like summer!",
    questions: [
      { q: "夏天天气怎么样？", options: ["Hot", "Warm", "Cold"], answer: 0 },
      { q: "Ben 夏天喜欢吃什么？", options: ["Ice cream", "Noodles", "Rice"], answer: 0 },
    ],
  },
  "e2s-u2-l1": {
    title: "At the Zoo",
    text: "We go to the zoo today. The tiger is strong. The elephant has a long nose. The monkey is funny. The panda is black and white. Ben likes the elephant. Lily likes the panda. 'Look at the monkey!' says Ben. The animals at the zoo are fun. We are happy at the zoo.",
    questions: [
      { q: "Ben 喜欢什么动物？", options: ["The elephant", "The panda", "The tiger"], answer: 0 },
      { q: "熊猫是什么颜色的？", options: ["Black and white", "Green and yellow", "Red and blue"], answer: 0 },
    ],
  },
  "e2s-u3-l1": {
    title: "My Toys",
    text: "This is my toy. I have a ball. The doll is cute. Fly the kite high! The car is fast. Ben has many toys: a ball, a doll, a kite and a car. He plays with them every day. 'My kite is high in the sky!' says Ben. 'My car is fast!' Toys are fun. I like my toys.",
    questions: [
      { q: "Ben 的风筝怎么样？", options: ["High in the sky", "Small and old", "In the box"], answer: 0 },
      { q: "哪个玩具是 cute 的？", options: ["The doll", "The car", "The ball"], answer: 0 },
    ],
  },
  "e2s-u4-l1": {
    title: "Food and Drinks",
    text: "I eat rice. I like noodles. I am hungry! Drink some water. Milk is good for you. Rice and noodles are good too. 'I am hungry, Mum!' says Ben. 'Eat rice and drink milk,' says Mum. Ben eats and drinks. Yum! Good food and drinks make us big and strong.",
    questions: [
      { q: "Ben 怎么了？", options: ["He is hungry", "He is happy", "He is late"], answer: 0 },
      { q: "什么对你有好处？", options: ["Milk", "Water", "The sun"], answer: 0 },
    ],
  },
  "e2s-u5-l1": {
    title: "I Can Do It",
    text: "I can run fast. I can jump high. I can sing. Lily can dance. I can draw a cat. Ben can run, jump and sing. Lily can dance and draw. We can do many things! 'I can draw a cat. Can you draw a dog?' says Ben. 'Yes, I can!' says Lily. We are super!",
    questions: [
      { q: "Lily 会做什么？", options: ["She can dance", "She can sing", "She can swim"], answer: 0 },
      { q: "Ben 画了什么？", options: ["A cat", "A dog", "A ball"], answer: 0 },
    ],
  },
};

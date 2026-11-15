// Amharic for the Brimful app. The app is written in English; when Amharic is on, every text node and label that
// appears on screen is swapped for its Amharic version (exact phrases first, then patterns for text with numbers).
// Anything without a translation stays in English, so nothing ever disappears.
// Translation is new and machine-assisted: it must be reviewed by a native speaker (see RISK_REGISTER.md).

const AM = {
  // navigation & common
  "Skip to content": "ወደ ይዘቱ ዝለል", "Sections": "ክፍሎች", "Jars": "ማሰሮዎች", "Challenges": "ፈተናዎች", "Split": "አከፋፍል", "Settings": "ቅንብሮች",
  "Free": "ነጻ", "Plus": "Plus", "Checking…": "በማረጋገጥ ላይ…", "Close": "ዝጋ", "Cancel": "ሰርዝ", "Save": "አስቀምጥ", "Done": "ተጠናቀቀ", "Delete": "ሰርዝ",
  "Go back": "ተመለስ", "Not now": "አሁን አይደለም", "Restore": "መልስ", "Turn off": "አጥፋ", "Keep it": "ይቆይ", "Keep going": "ቀጥል", "Note": "ማስታወሻ", "(optional)": "(አማራጭ)",
  "← All jars": "← ሁሉም ማሰሮዎች", "← Challenges": "← ፈተናዎች", "← Settings": "← ቅንብሮች", "Brimful home page": "የBrimful መነሻ ገጽ",
  "Brimful needs JavaScript to run. Your data stays on this device.": "Brimful እንዲሠራ JavaScript ያስፈልገዋል። መረጃዎ በዚህ መሣሪያ ላይ ብቻ ይቀመጣል።",

  // shelf & jars
  "Your jars": "ማሰሮዎችዎ", "New jar": "አዲስ ማሰሮ", "Create a jar": "ማሰሮ ፍጠር", "Start your first jar": "የመጀመሪያ ማሰሮዎን ይጀምሩ", "Total saved": "በአጠቃላይ የተቆጠበ",
  "Name a jar, set a target, and drop money in whenever you can. Brimful only keeps track: your money stays wherever you keep it.": "ለማሰሮው ስም ይስጡ፣ ግብ ያስቀምጡ፣ በቻሉ ቁጥርም ገንዘብ ይጨምሩ። Brimful የሚመዘግበው ብቻ ነው፤ ገንዘብዎ ባስቀመጡበት ቦታ ይቆያል።",
  "Everything you enter is saved on this device only. No account, no bank login.": "የሚያስገቡት ሁሉ በዚህ መሣሪያ ላይ ብቻ ይቀመጣል። መለያ የለም፣ የባንክ መግቢያም አያስፈልግም።",
  "What are you saving for?": "ለምን እየቆጠቡ ነው?", "What's it for?": "ለምንድን ነው?", "Your currency": "ገንዘብዎ (ምንዛሪ)", "By when?": "እስከ መቼ?",
  "Add a date and Brimful works out a weekly amount.": "ቀን ካስገቡ Brimful በየሳምንቱ ምን ያህል መቆጠብ እንዳለብዎ ያሰላል።",
  "Coin colour": "የሳንቲም ቀለም", "Brass": "ነሐስ", "Jade · Plus": "ጄድ · Plus", "Ink · Plus": "ቀለም ጥቁር · Plus", "Rose · Plus": "ሮዝ · Plus", "Silver · Plus": "ብር · Plus", "Sunset · Plus": "ጀንበር · Plus",
  "Part of Brimful Plus": "የBrimful Plus አካል", "e.g. New phone": "ለምሳሌ፦ አዲስ ስልክ", "e.g. Birthday money": "ለምሳሌ፦ የልደት ስጦታ ገንዘብ", "e.g. Bus fare": "ለምሳሌ፦ የአውቶቡስ ታሪፍ",
  "Add money": "ገንዘብ ጨምር", "Add to jar": "ወደ ማሰሮው ጨምር", "Add another amount": "ሌላ መጠን ጨምር", "Quick add": "በፍጥነት ጨምር", "Take out": "አውጣ", "Take money out": "ገንዘብ አውጣ",
  "Saved so far": "እስካሁን የተቆጠበ", "Milestones": "ደረጃዎች", "History": "ታሪክ", "Added": "ገብቷል", "Took out": "ወጥቷል", "not reached yet": "ገና አልደረሰም",
  "Edit jar": "ማሰሮውን አስተካክል", "Delete jar": "ማሰሮውን ሰርዝ", "Share progress": "ሂደቱን አጋራ", "Share your progress": "ሂደትዎን ያጋሩ", "Save or share": "አስቀምጥ ወይም አጋራ",
  "Show the amounts on the card": "መጠኖቹን በካርዱ ላይ አሳይ", "The picture is made on your phone. Nothing is uploaded unless you share it yourself.": "ምስሉ በስልክዎ ላይ ነው የሚሠራው። እርስዎ ራስዎ ካላጋሩት በቀር ምንም ነገር አይላክም።",
  "This removes the jar, its history and any challenges linked to it from this device. It can't be undone.": "ይህ ማሰሮውን፣ ታሪኩን እና ከሱ ጋር የተያያዙ ፈተናዎችን ከዚህ መሣሪያ ያጠፋል። መልሶ ማምጣት አይቻልም።",
  "Free includes 2 jars": "ነጻው እቅድ 2 ማሰሮዎችን ያካትታል",
  "Brimful Plus gives you unlimited jars, every challenge at once, the paycheck splitter and all jar colours. One payment, no subscription.": "Brimful Plus ያልተገደቡ ማሰሮዎችን፣ ሁሉንም ፈተናዎች በአንድ ጊዜ፣ የደመወዝ አከፋፋዩን እና ሁሉንም የማሰሮ ቀለሞች ይሰጥዎታል። አንድ ጊዜ ይከፍላሉ፤ ወርሃዊ ክፍያ የለም።",
  "See Brimful Plus": "Brimful Plusን ይመልከቱ", "Jar deleted.": "ማሰሮው ተሰርዟል።", "Jar updated.": "ማሰሮው ተስተካክሏል።", "Entry removed.": "መዝገቡ ተወግዷል።",
  "Can't remove that one: the jar would drop below zero.": "ይህን ማስወገድ አይቻልም፦ ማሰሮው ከዜሮ በታች ይወርዳል።",
  "Give your jar a name.": "ለማሰሮዎ ስም ይስጡ።", "Enter a target above zero, like 15000.": "ከዜሮ በላይ የሆነ ግብ ያስገቡ፣ ለምሳሌ 15000።", "Enter an amount above zero, like 250.": "ከዜሮ በላይ የሆነ መጠን ያስገቡ፣ ለምሳሌ 250።",
  "Picture saved.": "ምስሉ ተቀምጧል።", "Couldn't make the picture.": "ምስሉን መሥራት አልተቻለም።", "Couldn't save. Your browser's storage may be full or blocked.": "ማስቀመጥ አልተቻለም። የአሳሽዎ ማከማቻ ሞልቶ ወይም ታግዶ ሊሆን ይችላል።",

  // challenges
  "Start a challenge": "ፈተና ጀምር", "100 envelopes": "100 ፖስታዎች", "52 weeks": "52 ሳምንታት", "No-spend month": "ወጪ የሌለበት ወር",
  "Pick an envelope, save what's inside. Any order, your pace.": "ፖስታ ይምረጡ፣ በውስጡ ያለውን መጠን ይቆጥቡ። በፈለጉት ቅደም ተከተልና ፍጥነት።",
  "One small step a week for a year, growing as you go.": "ለአንድ ዓመት በሳምንት አንድ ትንሽ እርምጃ፤ እየጨመረ ይሄዳል።",
  "Mark each day you spend nothing extra. Bank what you kept.": "ተጨማሪ ወጪ ያላወጡበትን እያንዳንዱን ቀን ምልክት ያድርጉ። ያተረፉትን ያስቀምጡ።",
  "Small, repeatable steps that add up. Every step you tick drops its amount into one of your jars, and you can always un-tick it.": "እየተደመሩ የሚያድጉ ትናንሽ እርምጃዎች። ምልክት ያደረጉበት እያንዳንዱ እርምጃ መጠኑን ወደ አንዱ ማሰሮዎ ይጨምራል፤ ምልክቱንም መልሰው ማንሳት ይችላሉ።",
  "Saving into": "የሚቆጠብበት", "Into": "ወደ", "Draw an envelope for me": "ፖስታ ምረጥልኝ", "End this challenge": "ይህን ፈተና አቁም", "End this challenge?": "ይህ ፈተና ይቁም?", "End challenge": "ፈተናውን አቁም",
  ". Tap a tile when you've put that money aside. Tap again to undo.": "። ያንን ገንዘብ ሲያስቀምጡ ሳጥኑን ይንኩ። ለመመለስ እንደገና ይንኩ።",
  "The challenge is removed, but everything you've already saved stays in the jar.": "ፈተናው ይወገዳል፤ እስካሁን የቆጠቡት ሁሉ ግን በማሰሮው ውስጥ ይቆያል።",
  "Plus also includes unlimited jars, every challenge at once and all jar colours. One payment, no subscription.": "Plus በተጨማሪም ያልተገደቡ ማሰሮዎችን፣ ሁሉንም ፈተናዎች በአንድ ጊዜ እና ሁሉንም የማሰሮ ቀለሞች ያካትታል። አንድ ጊዜ ይከፍላሉ፤ ወርሃዊ ክፍያ የለም።",
  "lang": "ቋንቋ", "sound": "ድምፅ", "Past its date.": "ቀኑ አልፏል።", "Brimful. Goal reached.": "ሞልቷል። ግቡ ተሳክቷል።",
  "Free includes 1 challenge at a time": "ነጻው እቅድ በአንድ ጊዜ 1 ፈተና ያካትታል",
  "Brimful Plus lets you run as many challenges as you like, plus unlimited jars, the paycheck splitter and all jar colours. One payment, no subscription.": "በBrimful Plus የፈለጉትን ያህል ፈተናዎች ማካሄድ ይችላሉ፤ በተጨማሪም ያልተገደቡ ማሰሮዎች፣ የደመወዝ አከፋፋይ እና ሁሉም የማሰሮ ቀለሞች። አንድ ጊዜ ይከፍላሉ፤ ወርሃዊ ክፍያ የለም።",
  "Challenge complete. Every step done!": "ፈተናው ተጠናቋል። ሁሉም እርምጃዎች ተፈጽመዋል!", "Challenge ended. Your savings are still in the jar.": "ፈተናው ቆሟል። ቁጠባዎ አሁንም በማሰሮው ውስጥ ነው።",
  "Undone. That amount came back out of the jar.": "ተመልሷል። ያ መጠን ከማሰሮው ወጥቷል።", "Can't undo that one: the jar would drop below zero. Add money back to the jar first.": "ይህን መመለስ አይቻልም፦ ማሰሮው ከዜሮ በታች ይወርዳል። መጀመሪያ ገንዘብ ወደ ማሰሮው ይመልሱ።",
  "Fill in the numbers above to see your total.": "ድምሩን ለማየት ከላይ ያሉትን ቁጥሮች ይሙሉ።",

  // split
  "Split it": "አከፋፍል", "Amount received (ETB)": "የተቀበሉት መጠን (ETB)", "All of it is shared out.": "ሁሉም ተከፋፍሏል።",
  "Got paid, or got pocket money? Type the amount once and Brimful shares it between your jars by the percentages you choose.": "ደመወዝ ወይም የኪስ ገንዘብ አገኙ? መጠኑን አንድ ጊዜ ያስገቡ፤ Brimful በመረጧቸው መቶኛዎች መሠረት በማሰሮዎችዎ መካከል ያከፋፍለዋል።",
  "Type what came in, set a percentage for each jar, and split it in one tap. Your percentages are remembered.": "የገባውን መጠን ያስገቡ፣ ለእያንዳንዱ ማሰሮ መቶኛ ያስቀምጡ፣ በአንድ ንክኪ ያከፋፍሉ። መቶኛዎችዎ ይታወሳሉ።",
  "Enter the amount you received, like 8000.": "የተቀበሉትን መጠን ያስገቡ፣ ለምሳሌ 8000።", "Percentages add up to more than 100%.": "መቶኛዎቹ ድምር ከ100% በላይ ነው።", "Give at least one jar a percentage.": "ቢያንስ ለአንድ ማሰሮ መቶኛ ይስጡ።",

  // settings
  "Look and feel": "ገጽታ", "Currency": "ምንዛሪ", "Changing this relabels your amounts. It doesn't convert them.": "ይህን መቀየር የመጠኖቹን ምልክት ብቻ ይቀይራል እንጂ አይመነዝራቸውም።",
  "Theme": "ገጽታ ቀለም", "theme": "ገጽታ ቀለም", "Auto": "ራስ-ሰር", "Light": "ብሩህ", "Dark": "ጨለማ", "3D motion": "3D እንቅስቃሴ", "motion": "እንቅስቃሴ", "On": "በርቷል", "Reduced": "የቀነሰ",
  "Turn off to stop coins falling, tilting and flipping.": "ሳንቲሞች መውደቃቸውን፣ ማዘንበላቸውንና መገለባበጣቸውን ለማቆም ያጥፉት።", "Coin sounds": "የሳንቲም ድምፅ", "A soft clink when money lands.": "ገንዘብ ሲገባ ለስላሳ የሳንቲም ድምፅ።",
  "Language": "ቋንቋ", "Amharic is new. If something reads wrong, tell us at skelifywpd@gmail.com. Legal pages are in English.": "የአማርኛው ትርጉም አዲስ ነው። የተሳሳተ ነገር ካዩ በskelifywpd@gmail.com ያሳውቁን። የሕግ ገጾቹ በእንግሊዝኛ ናቸው።",
  "Your data": "መረጃዎ", "Everything is stored in this browser on this device. If you clear your browser data or lose your phone, it's gone unless you have a backup.": "ሁሉም ነገር በዚህ መሣሪያ አሳሽ ውስጥ ነው የሚቀመጠው። የአሳሹን መረጃ ካጠፉ ወይም ስልክዎ ከጠፋ፣ ምትኬ ከሌለዎት ይጠፋል።",
  "Backup file": "የምትኬ ፋይል", "Download a backup": "ምትኬ አውርድ", "Restore a backup file": "ከምትኬ ፋይል መልስ", "Delete everything on this device": "በዚህ መሣሪያ ያለውን ሁሉ ሰርዝ",
  "Delete everything?": "ሁሉም ይሰረዝ?", "Delete everything": "ሁሉንም ሰርዝ", "Yes, delete all my Brimful data on this device.": "አዎ፣ በዚህ መሣሪያ ያለውን የBrimful መረጃዬን በሙሉ ሰርዝ።",
  "All jars, history, challenges and settings will be removed from this device. This can't be undone. Download a backup first if you might want them back.": "ሁሉም ማሰሮዎች፣ ታሪክ፣ ፈተናዎች እና ቅንብሮች ከዚህ መሣሪያ ይጠፋሉ። መልሶ ማምጣት አይቻልም። መልሰው ሊፈልጓቸው ከቻሉ መጀመሪያ ምትኬ ያውርዱ።",
  "Also delete my cloud backup.": "የደመና ምትኬዬንም ሰርዝ።", "Tick the box to confirm.": "ለማረጋገጥ ሳጥኑ ላይ ምልክት ያድርጉ።",
  "Backup downloaded. Keep it somewhere safe.": "ምትኬው ወርዷል። ደህንነቱ በተጠበቀ ቦታ ያስቀምጡት።", "Backup restored.": "ምትኬው ተመልሷል።", "Everything was deleted from this device.": "ሁሉም ነገር ከዚህ መሣሪያ ተሰርዟል።",
  "That file is too large to be a Brimful backup.": "ይህ ፋይል የBrimful ምትኬ ለመሆን በጣም ትልቅ ነው።", "That isn't a Brimful backup file.": "ይህ የBrimful ምትኬ ፋይል አይደለም።",
  "About": "ስለ Brimful", "Legal": "ሕጋዊ", "Privacy": "ግላዊነት", "Terms": "ውሎች", "Refunds": "ተመላሽ ገንዘብ", "Storage & cookies": "ማከማቻ እና ኩኪዎች", "Accessibility": "ተደራሽነት",
  "Brimful is a tracker. It doesn't hold, move or invest money, and nothing here is financial advice. Made by SCALIFY WPD, Addis Ababa.": "Brimful መመዝገቢያ ብቻ ነው። ገንዘብ አይይዝም፣ አያንቀሳቅስም፣ ኢንቨስትም አያደርግም፤ እዚህ ያለው ምንም ነገር የፋይናንስ ምክር አይደለም። በSCALIFY WPD፣ አዲስ አበባ የተሠራ።",
  "Version 1.0 · Help: skelifywpd@gmail.com": "ስሪት 1.0 · እርዳታ፦ skelifywpd@gmail.com",
  "You're on Free": "ነጻውን እቅድ እየተጠቀሙ ነው", "Brimful Plus is active": "Brimful Plus ገቢር ነው", "Licence details": "የፈቃድ ዝርዝሮች", "Payment status": "የክፍያ ሁኔታ",
  "Free includes 2 jars and 1 challenge at a time, with the brass coin colour.": "ነጻው እቅድ 2 ማሰሮዎችን እና በአንድ ጊዜ 1 ፈተናን ከነሐስ የሳንቲም ቀለም ጋር ያካትታል።",
  "Thank you for supporting Brimful. Keep your licence key somewhere safe so you can restore Plus on a new device.": "Brimfulን ስለደገፉ እናመሰግናለን። በአዲስ መሣሪያ ላይ Plusን መልሰው እንዲያገኙ የፈቃድ ቁልፍዎን ደህንነቱ በተጠበቀ ቦታ ያስቀምጡ።",
  "We're checking your payment. Plus unlocks as soon as it's confirmed.": "ክፍያዎን እያረጋገጥን ነው። እንደተረጋገጠ Plus ይከፈታል።",

  // cloud backup
  "Cloud backup (optional)": "የደመና ምትኬ (አማራጭ)", "Cloud backup: on": "የደመና ምትኬ፦ በርቷል", "Turn on cloud backup": "የደመና ምትኬ አብራ", "Restore with a recovery code": "በመመለሻ ኮድ መልስ",
  "Keep an encrypted copy online, so you can get your jars back on a new phone with a recovery code. No account and no email. The copy is locked with your code before it leaves this device, so nobody else can read it, including us.": "በአዲስ ስልክ ላይ ማሰሮዎችዎን በመመለሻ ኮድ መልሰው እንዲያገኙ የተመሰጠረ ቅጂ በመስመር ላይ ያስቀምጡ። መለያም ኢሜይልም አያስፈልግም። ቅጂው ከዚህ መሣሪያ ከመውጣቱ በፊት በኮድዎ ይቆለፋል፤ ስለዚህ ማንም ሊያነበው አይችልም፣ እኛንም ጨምሮ።",
  "Back up now": "አሁን ምትኬ አስቀምጥ", "Show recovery code": "የመመለሻ ኮዱን አሳይ", "Your recovery code": "የመመለሻ ኮድዎ", "Recovery code": "የመመለሻ ኮድ", "Copy code": "ኮዱን ቅዳ",
  "Write this down or save it in your password manager. You need it to restore on another device.": "ይህን ይጻፉት ወይም በይለፍ ቃል ማስቀመጫዎ ያስቀምጡት። በሌላ መሣሪያ ላይ ለመመለስ ያስፈልግዎታል።",
  "If you lose this code, nobody can open the backup, not even us. Backups you don't update for 400 days are deleted.": "ይህ ኮድ ከጠፋብዎ ማንም ምትኬውን ሊከፍተው አይችልም፣ እኛም ጭምር። ለ400 ቀናት ያልታደሱ ምትኬዎች ይሰረዛሉ።",
  "I've saved my recovery code somewhere safe.": "የመመለሻ ኮዴን ደህንነቱ በተጠበቀ ቦታ አስቀምጫለሁ።", "Turn on backup": "ምትኬ አብራ", "Save the code first, then tick the box.": "መጀመሪያ ኮዱን ያስቀምጡ፣ ከዚያ ሳጥኑ ላይ ምልክት ያድርጉ።",
  "Anyone with this code can open your backup. Don't share it.": "ይህ ኮድ ያለው ማንኛውም ሰው ምትኬዎን ሊከፍት ይችላል። ለማንም አያጋሩት።",
  "Turn off cloud backup?": "የደመና ምትኬ ይጥፋ?", "The online copy is deleted. Your jars on this device stay as they are.": "በመስመር ላይ ያለው ቅጂ ይሰረዛል። በዚህ መሣሪያ ያሉት ማሰሮዎችዎ እንዳሉ ይቆያሉ።",
  "Keep it on": "ይብራ", "Turn off and delete copy": "አጥፋና ቅጂውን ሰርዝ", "Restore from cloud backup": "ከደመና ምትኬ መልስ", "This replaces everything currently on this device.": "ይህ አሁን በዚህ መሣሪያ ያለውን ሁሉ ይተካል።",
  "Backed up.": "ምትኬ ተቀምጧል።", "Recovery code copied.": "የመመለሻ ኮዱ ተቀድቷል።", "Press and hold the code to copy it.": "ኮዱን ለመቅዳት ተጭነው ይያዙት።",
  "Cloud backup is on. It updates by itself after changes.": "የደመና ምትኬ በርቷል። ለውጦች ሲኖሩ ራሱ ይታደሳል።", "Cloud backup is off and the online copy was deleted.": "የደመና ምትኬ ጠፍቷል፤ በመስመር ላይ ያለው ቅጂም ተሰርዟል።",
  "Couldn't reach the backup to delete it. Try again when you're online.": "ምትኬውን ለመሰረዝ ማግኘት አልተቻለም። በመስመር ላይ ሲሆኑ እንደገና ይሞክሩ።",
  "Couldn't reach the cloud backup to delete it. Check your connection and try again.": "የደመና ምትኬውን ለመሰረዝ ማግኘት አልተቻለም። ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።",
  "That doesn't look like a recovery code. It has 20 letters and numbers.": "ይህ የመመለሻ ኮድ አይመስልም። 20 ፊደላትና ቁጥሮች አሉት።",
  "No backup found for this recovery code. Check it and try again.": "ለዚህ የመመለሻ ኮድ ምትኬ አልተገኘም። ያረጋግጡና እንደገና ይሞክሩ።", "That recovery code doesn't open this backup.": "ይህ የመመለሻ ኮድ ይህን ምትኬ አይከፍትም።",
  "That backup is damaged.": "ይህ ምትኬ ተበላሽቷል።", "Couldn't reach the backup right now.": "አሁን ምትኬውን ማግኘት አልተቻለም።", "Cloud backup is off.": "የደመና ምትኬ ጠፍቷል።",
  "Your data is too large for cloud backup. Use Download a backup instead.": "መረጃዎ ለደመና ምትኬ በጣም ትልቅ ነው። በምትኩ «ምትኬ አውርድ»ን ይጠቀሙ።", "Couldn't back up right now.": "አሁን ምትኬ ማስቀመጥ አልተቻለም።",

  // Plus & payment
  "Brimful Plus": "Brimful Plus", "Pay once. Keep it.": "አንድ ጊዜ ይክፈሉ። ለዘለቄታው ይጠቀሙ።", "Plus is active": "Plus ገቢር ነው",
  "Unlimited jars": "ያልተገደቡ ማሰሮዎች", "Run every challenge at the same time": "ሁሉንም ፈተናዎች በአንድ ጊዜ ያካሂዱ", "Split: share money between jars in one tap": "አከፋፍል፦ ገንዘብን በአንድ ንክኪ በማሰሮዎች መካከል ያከፋፍሉ", "All six coin colours": "ሁሉም ስድስት የሳንቲም ቀለሞች",
  "Your licence key": "የፈቃድ ቁልፍዎ", "Licence key or Whop receipt number": "የፈቃድ ቁልፍ ወይም የWhop ደረሰኝ ቁጥር",
  "Bought Plus on Whop's website? Paste the receipt number from Whop's email (it starts with pay_).": "Plusን በWhop ድረ ገጽ ላይ ገዝተዋል? ከWhop ኢሜይል የደረሰኙን ቁጥር ይለጥፉ (በpay_ ይጀምራል)።",
  "Paste your licence key (36 characters with dashes) or your Whop receipt number (starts with pay_).": "የፈቃድ ቁልፍዎን (ሰረዝን ጨምሮ 36 ቁምፊዎች) ወይም የWhop ደረሰኝ ቁጥርዎን (በpay_ የሚጀምር) ይለጥፉ።",
  "We couldn't find that receipt. Check it starts with pay_ and was copied in full.": "ያንን ደረሰኝ ማግኘት አልቻልንም። በpay_ መጀመሩንና ሙሉ በሙሉ መቅዳቱን ያረጋግጡ።",
  "That receipt isn't for Brimful Plus.": "ይህ ደረሰኝ ለBrimful Plus አይደለም።", "That payment isn't completed, or it was refunded.": "ይህ ክፍያ አልተጠናቀቀም፣ ወይም ተመላሽ ተደርጓል።", "Licence key": "የፈቃድ ቁልፍ", "Copy key": "ቁልፉን ቅዳ",
  "Save this somewhere safe. It restores Plus on another device or after clearing your browser. Cloud backup (in Settings) keeps it for you too.": "ይህን ደህንነቱ በተጠበቀ ቦታ ያስቀምጡ። በሌላ መሣሪያ ላይ ወይም አሳሽዎን ካጸዱ በኋላ Plusን ይመልሳል። በቅንብሮች ያለው የደመና ምትኬም ይይዝልዎታል።",
  "Refunds: within 14 days of paying, email skelifywpd@gmail.com with this key. See the": "ተመላሽ ገንዘብ፦ ከከፈሉ በ14 ቀናት ውስጥ ይህን ቁልፍ ይዘው ወደ skelifywpd@gmail.com ኢሜይል ይላኩ። ይመልከቱ፦", "refund policy": "የተመላሽ ገንዘብ ፖሊሲ",
  "Checking your payment": "ክፍያዎን በማረጋገጥ ላይ", "Finishing your card payment": "የካርድ ክፍያዎን በማጠናቀቅ ላይ", "Check now": "አሁን አረጋግጥ", "I didn't pay: choose again": "አልከፈልኩም፦ እንደገና ልምረጥ",
  "We check every payment by hand, usually within 24 hours. This page updates by itself, and Plus unlocks as soon as it's confirmed.": "እያንዳንዱን ክፍያ በእጅ እናረጋግጣለን፤ ብዙውን ጊዜ በ24 ሰዓት ውስጥ። ይህ ገጽ ራሱ ይታደሳል፤ ክፍያው እንደተረጋገጠ Plus ይከፈታል።",
  "As soon as Whop confirms your card payment, Plus unlocks here. This usually takes a few seconds after you pay.": "Whop የካርድ ክፍያዎን እንዳረጋገጠ Plus እዚህ ይከፈታል። ብዙውን ጊዜ ከከፈሉ በኋላ ጥቂት ሰከንዶች ይወስዳል።",
  "Choose another way to pay?": "ሌላ የክፍያ መንገድ ይመርጣሉ?", "Choose again": "እንደገና ምረጥ",
  "Only do this if you didn't finish paying on Whop. If you did pay, press Check now instead, or email skelifywpd@gmail.com with your licence key.": "ይህን የሚያደርጉት በWhop ላይ ክፍያውን ካላጠናቀቁ ብቻ ነው። ከከፈሉ ግን «አሁን አረጋግጥ»ን ይጫኑ፣ ወይም የፈቃድ ቁልፍዎን ይዘው ወደ skelifywpd@gmail.com ይጻፉ።",
  "Your earlier purchase was refunded, so this device is back on Free. Your jars are all still here.": "ቀደም ሲል የገዙት ተመላሽ ስለተደረገ ይህ መሣሪያ ወደ ነጻው እቅድ ተመልሷል። ማሰሮዎችዎ በሙሉ አሁንም አሉ።",
  "How to pay": "እንዴት እንደሚከፍሉ", "Loading payment details…": "የክፍያ ዝርዝሮች በመጫን ላይ…", "Already bought it?": "ቀድመው ገዝተዋል?", "Restore Plus": "Plusን መልስ",
  "Brimful is free to use without Plus, and your existing jars are never locked.": "Brimfulን ያለ Plus በነጻ መጠቀም ይችላሉ፤ ያሉዎት ማሰሮዎችም ፈጽሞ አይቆለፉም።", "14-day refund": "የ14 ቀን ተመላሽ",
  "You need to be online to buy Plus. Check your connection and open this page again.": "Plusን ለመግዛት በመስመር ላይ መሆን አለብዎት። ግንኙነትዎን ያረጋግጡና ይህን ገጽ እንደገና ይክፈቱ።",
  "Payment method": "የክፍያ መንገድ", "Bank transfer": "የባንክ ዝውውር", "Card": "ካርድ", "1. Send exactly": "1. በትክክል ይህን ይላኩ", "To (Telebirr)": "ለ (ቴሌብር)", "How": "እንዴት",
  "Scan the code in the Telebirr app": "ኮዱን በቴሌብር መተግበሪያ ይቃኙ", "Bank": "ባንክ", "Account number": "የሂሳብ ቁጥር", "Account name": "የሂሳብ ስም", "Copy account number": "የሂሳብ ቁጥሩን ቅዳ",
  "Price": "ዋጋ", "Paid through": "የሚከፈለው በ", "Whop secure checkout (cards; other options Whop offers in your country)": "የWhop ደህንነቱ የተጠበቀ የክፍያ ገጽ (ካርዶች፤ Whop በአገርዎ የሚያቀርባቸው ሌሎች አማራጮች)",
  "Whop may add sales tax or VAT where the law requires it, and your bank may charge a foreign-transaction fee. Whop shows the final total before you pay. Plus unlocks automatically after payment.": "ሕጉ በሚጠይቅበት ቦታ Whop የሽያጭ ታክስ ወይም ተ.እ.ታ ሊጨምር ይችላል፤ ባንክዎም የውጭ ግብይት ክፍያ ሊያስከፍል ይችላል። ከመክፈልዎ በፊት Whop የመጨረሻውን ድምር ያሳይዎታል። ከክፍያ በኋላ Plus ራሱ ይከፈታል።",
  "2. Tell us it's sent": "2. መላኩን ያሳውቁን", "Name the payment came from": "ክፍያው የተላከበት ስም", "Transaction ID": "የግብይት መለያ ቁጥር",
  "From the Telebirr SMS or your bank receipt, e.g. CK12AB34CD.": "ከቴሌብር አጭር መልዕክት ወይም ከባንክ ደረሰኝዎ፣ ለምሳሌ CK12AB34CD።", "I have already sent the payment.": "ክፍያውን አስቀድሜ ልኬያለሁ።",
  "I'm 18 or older, or a parent or guardian has agreed to this purchase.": "ዕድሜዬ 18 ወይም ከዚያ በላይ ነው፣ ወይም ወላጅ ወይም አሳዳጊ በዚህ ግዢ ተስማምተዋል።",
  "By continuing you agree to the": "በመቀጠልዎ በሚከተሉት ይስማማሉ፦", "terms": "ውሎች", "privacy": "ግላዊነት", "Submit for checking": "ለማረጋገጫ ላክ", "Continue to secure checkout": "ወደ ደህንነቱ የተጠበቀ ክፍያ ቀጥል",
  "Opening checkout…": "የክፍያ ገጹን በመክፈት ላይ…", "Sending…": "በመላክ ላይ…",
  "We use your name and transaction ID only to match your payment (see": "ስምዎንና የግብይት መለያ ቁጥርዎን የምንጠቀመው ክፍያዎን ለማዛመድ ብቻ ነው (ይመልከቱ፦", "). We never ask for your PIN or password.": ")። የሚስጥር ቁጥርዎን ወይም የይለፍ ቃልዎን ፈጽሞ አንጠይቅም።",
  "Whop handles your card details; we never see them. We only learn that a payment for your licence key went through (see": "የካርድ ዝርዝሮችዎን የሚይዘው Whop ነው፤ እኛ ፈጽሞ አናያቸውም። የምናውቀው ለፈቃድ ቁልፍዎ ክፍያ መፈጸሙን ብቻ ነው (ይመልከቱ፦", ").": ")።",
  "Enter the name the payment came from.": "ክፍያው የተላከበትን ስም ያስገቡ።", "Enter the transaction ID from your SMS or receipt (letters and numbers).": "ከአጭር መልዕክቱ ወይም ከደረሰኙ የግብይት መለያ ቁጥሩን ያስገቡ (ፊደላትና ቁጥሮች)።",
  "Tick the box to confirm you've sent the payment.": "ክፍያውን መላክዎን ለማረጋገጥ ሳጥኑ ላይ ምልክት ያድርጉ።", "Please confirm you're 18 or older, or that a parent or guardian agreed.": "ዕድሜዎ 18 ወይም ከዚያ በላይ መሆኑን፣ ወይም ወላጅ ወይም አሳዳጊ መስማማታቸውን ያረጋግጡ።",
  "That doesn't look like a licence key. It has 36 characters with dashes.": "ይህ የፈቃድ ቁልፍ አይመስልም። ሰረዝን ጨምሮ 36 ቁምፊዎች አሉት።", "We can't find that key. Check it and try again.": "ያንን ቁልፍ ማግኘት አልቻልንም። ያረጋግጡና እንደገና ይሞክሩ።",
  "We can't find that licence key.": "ያንን የፈቃድ ቁልፍ ማግኘት አልቻልንም።", "Couldn't check right now.": "አሁን ማረጋገጥ አልተቻለም።",
  "Brimful Plus is unlocked. Thank you!": "Brimful Plus ተከፍቷል። እናመሰግናለን!", "Brimful Plus restored.": "Brimful Plus ተመልሷል።", "Licence key copied.": "የፈቃድ ቁልፉ ተቀድቷል።", "Account number copied.": "የሂሳብ ቁጥሩ ተቀድቷል።",
  "Press and hold the key to copy it.": "ቁልፉን ለመቅዳት ተጭነው ይያዙት።", "Press and hold the number to copy it.": "ቁጥሩን ለመቅዳት ተጭነው ይያዙት።",
  "Still being checked. We'll unlock it as soon as it's confirmed.": "አሁንም በማረጋገጥ ላይ ነው። እንደተረጋገጠ እንከፍተዋለን።", "Not confirmed yet. If you finished paying, give it a few seconds.": "ገና አልተረጋገጠም። ክፍያውን ካጠናቀቁ ጥቂት ሰከንዶች ይጠብቁ።",
  "You're offline, or the payment service can't be reached. Try again in a moment.": "ከመስመር ውጭ ነዎት፣ ወይም የክፍያ አገልግሎቱ ሊገኝ አልቻለም። ትንሽ ቆይተው እንደገና ይሞክሩ።", "Something went wrong. Please try again.": "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
  "This transaction ID was already submitted. If that was you, restore with your licence key.": "ይህ የግብይት መለያ ቁጥር አስቀድሞ ገብቷል። እርስዎ ከሆኑ በፈቃድ ቁልፍዎ ይመልሱ።",
  "Card payments aren't available right now. You can pay with Telebirr or a bank transfer.": "የካርድ ክፍያ አሁን አይገኝም። በቴሌብር ወይም በባንክ ዝውውር መክፈል ይችላሉ።",
  "The card checkout isn't responding. Please try again, or pay with Telebirr or a bank transfer.": "የካርድ ክፍያ ገጹ ምላሽ እየሰጠ አይደለም። እባክዎ እንደገና ይሞክሩ፣ ወይም በቴሌብር ወይም በባንክ ዝውውር ይክፈሉ።",
  "Too many attempts. Please try again in an hour.": "በጣም ብዙ ሙከራዎች። እባክዎ ከአንድ ሰዓት በኋላ እንደገና ይሞክሩ።", "This service isn't set up yet. Please try again later.": "ይህ አገልግሎት ገና አልተዘጋጀም። እባክዎ ቆይተው ይሞክሩ።",
  "We can't take new payments right now. Please contact us.": "አሁን አዲስ ክፍያ መቀበል አንችልም። እባክዎ ያግኙን።", "Couldn't save that. Please try again.": "ያንን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
};

// Text with numbers or names in it. Each entry: [English pattern, Amharic replacement].
const PATTERNS = [
  [/^Envelope (\d+), (.+), not done$/, "ፖስታ $1፣ $2፣ ገና አልተሞላም"], [/^Envelope (\d+), (.+), done$/, "ፖስታ $1፣ $2፣ ተሞልቷል"],
  [/^Week (\d+), (.+), not done$/, "ሳምንት $1፣ $2፣ ገና አልተሞላም"], [/^Week (\d+), (.+), done$/, "ሳምንት $1፣ $2፣ ተሞልቷል"],
  [/^Day (\d+), (.+), not done$/, "ቀን $1፣ $2፣ ገና አልተሞላም"], [/^Day (\d+), (.+), done$/, "ቀን $1፣ $2፣ ተሞልቷል"],
  [/^Envelope (\d+): put aside (.+), then tap it\.$/, "ፖስታ $1፦ $2 ያስቀምጡ፣ ከዚያ ይንኩት።"],
  [/^(.+) a week gets you there by (.+)\.$/, "በሳምንት $1 ካስቀመጡ እስከ $2 ይደርሳሉ።"],
  [/^Put aside (.+) a week for (\d+) weeks? to reach it on time\.$/, "በጊዜው ለመድረስ ለ$2 ሳምንታት በሳምንት $1 ያስቀምጡ።"],
  [/^(\d+)% of target$/, "ከግቡ $1%"], [/^(\d+)% complete$/, "$1% ተጠናቋል"], [/^(\d+)-week saving streak$/, "ለ$1 ሳምንታት ያለማቋረጥ ቆጥበዋል"],
  [/^In the jar now: (.+)$/, "አሁን በማሰሮው ውስጥ፦ $1"], [/^Amount \((\w+)\)$/, "መጠን ($1)"], [/^Target \((\w+)\)$/, "ግብ ($1)"], [/^Amount received \((\w+)\)$/, "የተቀበሉት መጠን ($1)"],
  [/^of (.+) · (\d+) of (\d+) done$/, "ከ$1 · ከ$3 $2 ተሞልተዋል"], [/^· (\d+) of (\d+) done · (.+) of (.+)$/, "· ከ$2 $1 ተሞልተዋል · ከ$4 $3"],
  [/^of (.+) · (\d+)%$/, "ከ$1 · $2%"], [/^of (.+)$/, "ከ$1"], [/^across 1 jar$/, "በ1 ማሰሮ"], [/^across (\d+) jars$/, "በ$1 ማሰሮዎች"],
  [/^(.+): (\d+)% full$/, "$1፦ $2% ሞልቷል"], [/^Share card: (.+), (\d+)% full$/, "የማጋሪያ ካርድ፦ $1፣ $2% ሞልቷል"],
  [/^Remove this entry of (.+)$/, "ይህን የ$1 መዝገብ አስወግድ"], [/^Percent for (.+), slider$/, "የ$1 መቶኛ፣ ማንሸራተቻ"], [/^Percent for (.+)$/, "የ$1 መቶኛ"],
  [/^Delete “(.+)”\?$/, "«$1» ይሰረዝ?"], [/^Added · (.+)$/, "ገብቷል · $1"], [/^Took out · (.+)$/, "ወጥቷል · $1"],
  [/^No-spend (\w+) (\d{4})$/, "ወጪ የሌለበት ወር፦ $1 $2"], [/^52 weeks · classic$/, "52 ሳምንታት · እየጨመረ"], [/^52 weeks · reverse$/, "52 ሳምንታት · እየቀነሰ"], [/^52 weeks · flat$/, "52 ሳምንታት · እኩል"],
  [/^(\d+)% stays unallocated\.$/, "$1% ሳይከፋፈል ይቀራል።"], [/^(\d+)% stays unallocated \((.+)\)\.$/, "$1% ($2) ሳይከፋፈል ይቀራል።"],
  [/^That's (\d+)%\. Bring the total down to 100% or less\.$/, "$1% ነው። ድምሩን ወደ 100% ወይም ከዚያ በታች ያውርዱ።"],
  [/^Shared between 1 jar\.$/, "ወደ 1 ማሰሮ ገብቷል።"], [/^Shared between (\d+) jars\.$/, "በ$1 ማሰሮዎች መካከል ተከፋፍሏል።"], [/^Restored 1 jar\. Cloud backup stays on with this code\.$/, "1 ማሰሮ ተመልሷል። የደመና ምትኬ በዚህ ኮድ እንደበራ ይቆያል።"], [/^Restored (\d+) jars?\. Cloud backup stays on with this code\.$/, "$1 ማሰሮዎች ተመልሰዋል። የደመና ምትኬ በዚህ ኮድ እንደበራ ይቆያል።"],
  [/^(\d+) envelopes from (.+) to (.+)\. Finish them all and you've saved (.+)\.$/, "ከ$2 እስከ $3 የሆኑ $1 ፖስታዎች። ሁሉንም ሲጨርሱ $4 ይቆጥባሉ።"],
  [/^52 weekly steps\. Finish them all and you've saved (.+)\.$/, "52 ሳምንታዊ እርምጃዎች። ሁሉንም ሲጨርሱ $1 ይቆጥባሉ።"],
  [/^Encrypted on this device before upload\. Last backed up: (.+)\.$/, (m, w) => `ከመላኩ በፊት በዚህ መሣሪያ ላይ ይመሰጠራል። ምትኬ የተቀመጠው፦ ${when(w)}።`],
  [/^We couldn't confirm your last payment: (.+) You can send the details again below, or email skelifywpd@gmail.com\.$/, "የመጨረሻ ክፍያዎን ማረጋገጥ አልቻልንም፦ $1 ዝርዝሮቹን ከታች እንደገና መላክ ወይም ወደ skelifywpd@gmail.com መጻፍ ይችላሉ።"],
  [/^We couldn't confirm your last payment\. You can send the details again below, or email skelifywpd@gmail.com\.$/, "የመጨረሻ ክፍያዎን ማረጋገጥ አልቻልንም። ዝርዝሮቹን ከታች እንደገና መላክ ወይም ወደ skelifywpd@gmail.com መጻፍ ይችላሉ።"],
  [/^or (\$[\d.]+ USD)$/, "ወይም $1"], [/^one-time · no subscription$/, "አንድ ጊዜ · ወርሃዊ ክፍያ የለም"], [/^(\$[\d.]+ USD), one-time$/, "$1፣ አንድ ጊዜ"],
  [/^Telebirr QR code to pay (.+)$/, "ለ$1 ለመክፈል የቴሌብር QR ኮድ"],
];
const when = (w) => ({ "just now": "አሁን", "not yet": "ገና" }[w] ?? w.replace(/^(\d+) min ago$/, "ከ$1 ደቂቃ በፊት").replace(/^(\d+) h ago$/, "ከ$1 ሰዓት በፊት"));

let on = false;
export const isAmharic = () => on;

export function translate(text) {
  if (!on) return text;
  const t = text.trim();
  if (!t) return text;
  let out = AM[t];
  if (out === undefined) {
    for (const [re, rep] of PATTERNS) { if (re.test(t)) { out = t.replace(re, rep); break; } }
  }
  return out === undefined ? text : text.replace(t, out);
}

const ATTRS = ["aria-label", "placeholder", "alt", "title"];
function walk(root) {
  if (root.nodeType === 3) { const v = translate(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; return; }
  if (root.nodeType !== 1 || root.closest?.("script,style,.key,[data-no-tr]")) return;
  for (const a of ATTRS) { const v = root.getAttribute(a); if (v) { const n = translate(v); if (n !== v) root.setAttribute(a, n); } }
  for (const c of root.childNodes) walk(c);
}

/** Turns Amharic on for this page (if chosen) and keeps translating whatever the app renders. */
export function startI18n(setting) {
  const prefersAm = (navigator.languages || [navigator.language]).some((l) => /^am\b/i.test(l || ""));
  on = setting === "am" || (setting !== "en" && prefersAm);
  document.documentElement.lang = on ? "am" : "en";
  if (!on) return;
  walk(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") walk(m.target);
      else if (m.type === "attributes") walk(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

"""
Generates the PlayerPulse synthetic test pack (2 fictional games).

Everything here is SYNTHETIC and written for testing: fictional games, fictional
players, planted issues. Re-running with the same seed gives identical files.

    python tools/generate_data.py
"""
import csv
import json
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = 20261009

# ---------------------------------------------------------------------------
# SCENARIO A  - "Ember Trail", 2D action platformer, 10 levels, patch 1.4
# ---------------------------------------------------------------------------
A_GAME = {
    "scenario": "A",
    "game": "Ember Trail (fictional)",
    "genre": "2D action platformer, single player",
    "unit": "level",
    "previous_patch": "1.3",
    "current_patch": "1.4",
    "patch_date": "2026-10-02",
    "levels": {
        "1": "Ashfield",
        "2": "Old Mill",
        "3": "Thorn Canyon",
        "4": "Twin Bridges",
        "5": "Clocktower",
        "6": "Magma Warden (boss)",
        "7": "Frost Keep (boss)",
        "8": "Sunken Road",
        "9": "Archive",
        "10": "Ember Throne (final boss)",
    },
    "patch_notes_1_4": [
        "New main menu",
        "Boss tuning pass",
        "Physics and collision optimisation",
        "Save system refactor",
        "Inventory UI rework",
        "Localisation updates",
    ],
}

# (level, comp_prev, comp_cur, deaths_prev, deaths_cur, restarts_prev, restarts_cur, errors_prev, errors_cur, min_prev, min_cur)
A_TELEMETRY = [
    (1, .96, .96, 0.6, 0.6, 1.0, 1.0, 2, 3, 6, 6),
    (2, .92, .90, 1.0, 1.0, 1.1, 1.8, 1, 2, 9, 12),
    (3, .85, .84, 3.2, 3.3, 1.3, 1.3, 2, 1, 14, 14),
    (4, .80, .43, 2.1, 2.2, 1.2, 2.6, 3, 4, 12, 19),
    (5, .78, .77, 2.8, 2.9, 1.6, 1.6, 1, 2, 11, 11),
    (6, .70, .51, 4.1, 8.3, 1.8, 2.9, 2, 3, 16, 27),
    (7, .73, .45, 3.0, 3.1, 1.3, 1.9, 4, 418, 15, 15),
    (8, .69, .69, 3.4, 3.4, 1.4, 1.4, 2, 2, 13, 13),
    (9, .67, .66, 1.2, 1.2, 1.1, 1.1, 1, 1, 18, 19),
    (10, .61, .60, 5.0, 5.1, 1.9, 1.9, 3, 3, 22, 22),
]
A_STARTERS = {"1.3": 11800, "1.4": 12400}

A_ISSUES = [
    {"issue_id": "A-ISS-01", "category": "bug", "level": 4,
     "title": "Player falls through the floor after the second bridge (collision), since 1.4"},
    {"issue_id": "A-ISS-02", "category": "bug", "level": 7,
     "title": "Crash to desktop when opening inventory during the Frost Keep boss fight"},
    {"issue_id": "A-ISS-03", "category": "balance", "level": 6,
     "title": "Magma Warden boss HP/damage buff in 1.4 made the fight far too hard"},
    {"issue_id": "A-ISS-04", "category": "bug", "level": 2,
     "title": "Old Mill checkpoint shows 'saved' but progress is lost on reload"},
    {"issue_id": "A-ISS-05", "category": "bug", "level": 9,
     "title": "Russian localisation text overlaps / is cut off in the Archive level"},
    {"issue_id": "A-SKILL-03", "category": "skill_issue", "level": 3,
     "title": "'Level 3 is impossible' complaints - telemetry normal, NOT a real issue"},
    {"issue_id": "A-SKILL-05", "category": "skill_issue", "level": 5,
     "title": "'Clocktower timer too short' complaints - telemetry normal, NOT a real issue"},
    {"issue_id": "NOISE", "category": "noise", "level": None,
     "title": "Toxicity, feature requests, praise, pricing/account complaints, vague 'buggy' posts"},
]

# Each message: (issue_id, lang, channel, text)
# lang: en / az / ru / mixed ; channel: discord / steam_review / in_game
A_MESSAGES = [
    # ---------------- A-ISS-01  L4 fall through floor (30) ----------------
    ("A-ISS-01", "en", "discord", "Since 1.4 I keep falling through the floor right after the second bridge on level 4. Not a skill thing, the ground just isn't there."),
    ("A-ISS-01", "en", "steam_review", "Level 4 is broken after the update. You cross the second bridge, land on the platform and drop straight into the void. Lost 40 minutes."),
    ("A-ISS-01", "en", "discord", "lvl 4 second bridge = instant death, my character clips through the planks"),
    ("A-ISS-01", "en", "discord", "Love the new 1.4 feature where Twin Bridges lets you skip the floor entirely and fall forever. 10/10 physics"),
    ("A-ISS-01", "en", "steam_review", "Fell through the map on Twin Bridges three times in a row. Had to quit each time because you don't even die, you just keep falling."),
    ("A-ISS-01", "en", "discord", "anyone else stuck falling endlessly on level 4? happens after the second bridge every time"),
    ("A-ISS-01", "en", "in_game", "Fell through floor at bridge 2, level 4. Infinite fall, had to restart the game."),
    ("A-ISS-01", "en", "discord", "Great patch devs, now the bridges on level 4 are just decorative. Gravity mode unlocked lol"),
    ("A-ISS-01", "az", "discord", "4-cü səviyyədə ikinci körpüdən sonra yerin içindən düşürəm, 1.4 yeniləməsindən sonra başlayıb."),
    ("A-ISS-01", "az", "steam_review", "Yenilənmədən sonra Twin Bridges-də personaj döşəmədən keçib aşağı düşür. Ölmür də, sadəcə sonsuz düşür. Oyunu bağlamaq məcburiyyətində qaldım."),
    ("A-ISS-01", "az", "discord", "lvl 4 ikinci körpü baq var, xarakter yerin altına düşür"),
    ("A-ISS-01", "az", "in_game", "Səviyyə 4, ikinci körpüdən sonra platformaya düşəndə yerdən keçirəm. Hər dəfə."),
    ("A-ISS-01", "az", "discord", "Əla yeniləmə, artıq 4-cü səviyyədə uçmaq da olur 😂 yer yoxdur ümumiyyətlə"),
    ("A-ISS-01", "ru", "discord", "После патча 1.4 на 4 уровне проваливаюсь сквозь пол после второго моста."),
    ("A-ISS-01", "ru", "steam_review", "Twin Bridges сломан: после второго моста персонаж падает в текстуры и летит бесконечно. Приходится перезапускать игру."),
    ("A-ISS-01", "ru", "discord", "на 4-м уровне баг, провал под карту на втором мосту, каждый раз"),
    ("A-ISS-01", "ru", "in_game", "Уровень 4, второй мост — проваливаюсь под пол. Раньше такого не было."),
    ("A-ISS-01", "ru", "discord", "Спасибо за патч, теперь на 4 уровне можно бесплатно полетать под картой 👍"),
    ("A-ISS-01", "mixed", "discord", "bro level 4 ikinci mostdan sonra проваливаюсь, after update"),
    ("A-ISS-01", "mixed", "discord", "4 уровень после второго моста падаю сквозь пол, 1.4 broke it"),
    ("A-ISS-01", "en", "steam_review", "Can't finish the bridges level anymore. Right after the second bridge my guy falls through the platform. Worked fine before the patch."),
    ("A-ISS-01", "en", "discord", "is the floor after bridge 2 supposed to be missing?? fell through 5 times"),
    ("A-ISS-01", "en", "in_game", "level 4 collision broken, falling through ground near end of second bridge"),
    ("A-ISS-01", "az", "steam_review", "Oyun yaxşı idi, amma son yeniləmə 4-cü səviyyəni xarab edib. İkinci körpüdən sonra yerə düşmək əvəzinə yerin içindən keçirsən."),
    ("A-ISS-01", "ru", "steam_review", "Не рекомендую, пока не починят: на уровне с мостами проваливаешься под землю после второго моста."),
    ("A-ISS-01", "en", "discord", "Twin Bridges: if you jump off the second bridge onto the stone ledge you fall through it. Walking slowly sometimes works."),
    ("A-ISS-01", "az", "discord", "Twin Bridges-də daş platformaya tullananda yerdən keçirəm, yavaş gedəndə bəzən olmur"),
    ("A-ISS-01", "en", "discord", "pls fix level 4, can't progress, fall through floor every run"),
    ("A-ISS-01", "ru", "discord", "Кто-нибудь прошёл 4 уровень после патча? Я каждый раз проваливаюсь на втором мосту"),
    ("A-ISS-01", "en", "steam_review", "Refunding unless this is fixed: falling through the world on level 4 after the second bridge. 100% repro."),

    # ---------------- A-ISS-02  L7 inventory crash (20) ----------------
    ("A-ISS-02", "en", "discord", "Game crashes to desktop every time I open the inventory during the Frost Keep boss."),
    ("A-ISS-02", "en", "steam_review", "Level 7 boss: open inventory to heal = instant crash. Happened 4 times."),
    ("A-ISS-02", "en", "in_game", "Crash when pressing I during level 7 boss fight."),
    ("A-ISS-02", "en", "discord", "CTD on level 7 when I try to switch potions mid boss fight"),
    ("A-ISS-02", "en", "discord", "Nice, the Frost Keep boss now has a special attack called 'close the game when you open your bag'"),
    ("A-ISS-02", "az", "discord", "7-ci səviyyədə boss döyüşündə inventarı açanda oyun çökür."),
    ("A-ISS-02", "az", "steam_review", "Frost Keep bossunda inventar açan kimi oyun bağlanır, masaüstünə atır. Dörd dəfə oldu."),
    ("A-ISS-02", "az", "in_game", "Səviyyə 7, boss vaxtı inventarı açdım, oyun dondu və bağlandı."),
    ("A-ISS-02", "az", "discord", "lvl 7 boss inventar = crash, kimdə də var?"),
    ("A-ISS-02", "ru", "discord", "Вылет на рабочий стол, когда открываю инвентарь во время босса на 7 уровне."),
    ("A-ISS-02", "ru", "steam_review", "Игра крашится на боссе Frost Keep, если открыть инвентарь. Без зелий не пройти."),
    ("A-ISS-02", "ru", "in_game", "Уровень 7: открыл инвентарь в бою с боссом — вылет."),
    ("A-ISS-02", "ru", "discord", "7 уровень, босс, жму инвентарь и игра закрывается. Патч 1.4"),
    ("A-ISS-02", "mixed", "discord", "Frost Keep boss inventory açanda вылетает, every time"),
    ("A-ISS-02", "en", "steam_review", "Since 1.4 the ice boss fight crashes whenever I open my bag. Before the patch it was fine."),
    ("A-ISS-02", "en", "discord", "Can confirm the level 7 inventory crash, Windows 11, GTX 1660"),
    ("A-ISS-02", "az", "discord", "Buz bossunda çantanı açanda oyun çökür, iksir içmək mümkün deyil"),
    ("A-ISS-02", "ru", "discord", "подтверждаю вылет на 7 уровне при открытии инвентаря у босса"),
    ("A-ISS-02", "en", "in_game", "crash level 7 boss inventory"),
    ("A-ISS-02", "en", "discord", "workaround for the Frost Keep crash: don't open inventory during the boss, use quick slots"),

    # ---------------- A-ISS-03  L6 boss balance (20) ----------------
    ("A-ISS-03", "en", "discord", "Magma Warden is ridiculous after 1.4, he has like double HP now. Took me 30 tries."),
    ("A-ISS-03", "en", "steam_review", "The level 6 boss went from fair to impossible with this patch. Damage sponge."),
    ("A-ISS-03", "en", "discord", "did they buff the lava boss? fight takes forever now and one mistake = dead"),
    ("A-ISS-03", "en", "in_game", "Level 6 boss too much HP after update, please rebalance"),
    ("A-ISS-03", "en", "discord", "Magma Warden phase 2 lasts 4 minutes now. Not fun, just long."),
    ("A-ISS-03", "az", "discord", "6-cı səviyyənin bossu yeniləmədən sonra həddindən artıq güclüdür, canı iki dəfə artıb."),
    ("A-ISS-03", "az", "steam_review", "Magma Warden-i 1.4-dən sonra keçmək mümkün deyil, 25 dəfə öldüm. Əvvəl normal idi."),
    ("A-ISS-03", "az", "in_game", "Səviyyə 6 bossu çox çətindir, balansı düzəldin."),
    ("A-ISS-03", "az", "discord", "lava bossunu nerf edin pls, döyüş 5 dəqiqə çəkir"),
    ("A-ISS-03", "ru", "discord", "Босса на 6 уровне апнули? Здоровья стало вдвое больше, умираю постоянно."),
    ("A-ISS-03", "ru", "steam_review", "После патча Magma Warden — это стена. Раньше проходил с 3 попыток, теперь 20+."),
    ("A-ISS-03", "ru", "in_game", "Уровень 6, босс слишком сильный после обновления."),
    ("A-ISS-03", "ru", "discord", "понерфите лавового босса, это уже не сложно, а нечестно"),
    ("A-ISS-03", "mixed", "discord", "Magma Warden ilə 20 dəfə öldüm, after patch он слишком толстый"),
    ("A-ISS-03", "en", "steam_review", "Everything else in 1.4 is fine but the level 6 boss rebalance went way too far."),
    ("A-ISS-03", "en", "discord", "Magma Warden now survives 3 full combos in phase 2, before it was 1. Definitely changed."),
    ("A-ISS-03", "az", "discord", "Magma Warden-in canı çox artıb, əvvəl 2-3 cəhdə keçirdim"),
    ("A-ISS-03", "ru", "discord", "6 уровень невозможно пройти после 1.4, босс бессмертный"),
    ("A-ISS-03", "en", "in_game", "lava boss impossible now"),
    ("A-ISS-03", "en", "discord", "I'm good at this game and Magma Warden still took me an hour after the patch. Something is off with his HP."),

    # ---------------- A-ISS-04  L2 checkpoint save (12) ----------------
    ("A-ISS-04", "en", "discord", "Checkpoint in level 2 doesn't save. I quit after the mill and had to start the level over."),
    ("A-ISS-04", "en", "steam_review", "Lost progress twice: the Old Mill checkpoint shows the 'saved' icon but loading puts me at the start of level 2."),
    ("A-ISS-04", "en", "in_game", "level 2 checkpoint not loading, restart from beginning"),
    ("A-ISS-04", "az", "discord", "2-ci səviyyədə checkpoint işləmir, oyunu bağlayıb açanda əvvəldən başlayıram."),
    ("A-ISS-04", "az", "steam_review", "Old Mill-də yadda saxlama ikonu görünür, amma yükləyəndə səviyyənin əvvəlinə qaytarır."),
    ("A-ISS-04", "az", "in_game", "Səviyyə 2 checkpoint yadda saxlamır."),
    ("A-ISS-04", "ru", "discord", "Чекпоинт на 2 уровне не сохраняет, после перезапуска начинаю уровень заново."),
    ("A-ISS-04", "ru", "steam_review", "На Old Mill сохранение не работает — значок есть, а после загрузки всё сначала."),
    ("A-ISS-04", "ru", "in_game", "Уровень 2: сохранение на чекпоинте не загружается."),
    ("A-ISS-04", "mixed", "discord", "Old Mill checkpoint сохраняется, amma load edəndə əvvəldən"),
    ("A-ISS-04", "en", "discord", "anyone else losing level 2 progress after quitting? checkpoint seems broken since the patch"),
    ("A-ISS-04", "en", "discord", "The mill checkpoint only works if you wait a few seconds after the save icon. If you quit right away it's gone."),

    # ---------------- A-ISS-05  L9 RU localisation (7) ----------------
    ("A-ISS-05", "ru", "discord", "На 9 уровне в архиве текст подсказок налезает друг на друга в русской версии, ничего не прочитать."),
    ("A-ISS-05", "ru", "steam_review", "Русская локализация на уровне Archive: текст обрезается и выходит за рамки окна."),
    ("A-ISS-05", "ru", "in_game", "Уровень 9 — текст на русском перекрывает кнопки."),
    ("A-ISS-05", "en", "discord", "Playing in Russian, the Archive level (9) has overlapping text boxes, can't read the puzzle clues"),
    ("A-ISS-05", "az", "discord", "Rus dilində 9-cu səviyyədə mətnlər bir-birinin üstünə düşür, ipucunu oxumaq olmur"),
    ("A-ISS-05", "ru", "discord", "в архиве (9 уровень) подсказки к головоломке не влезают в окно, ру локализация"),
    ("A-ISS-05", "en", "in_game", "level 9 russian text overlaps UI"),

    # ---------------- A-SKILL-03  L3 'impossible' (22) ----------------
    ("A-SKILL-03", "en", "discord", "Level 3 is impossible. Who designed these spikes??"),
    ("A-SKILL-03", "en", "steam_review", "Thorn Canyon is broken, the jumps are unfair. Gave up."),
    ("A-SKILL-03", "en", "discord", "lvl 3 is literally unbeatable, fix your game"),
    ("A-SKILL-03", "en", "in_game", "level 3 too hard"),
    ("A-SKILL-03", "en", "discord", "the canyon level is BS, I die on the same jump 50 times"),
    ("A-SKILL-03", "en", "steam_review", "Game is broken, level 3 can't be done. Waste of money."),
    ("A-SKILL-03", "en", "discord", "Thorn Canyon wall jump doesn't work. I press jump and nothing happens"),
    ("A-SKILL-03", "en", "discord", "how is anyone passing level 3?? impossible"),
    ("A-SKILL-03", "az", "discord", "3-cü səviyyə ümumiyyətlə keçilmir, kim düzəldib bunu?"),
    ("A-SKILL-03", "az", "steam_review", "Thorn Canyon xarabdır, tullanmalar ədalətsizdir. Pulumu atdım."),
    ("A-SKILL-03", "az", "discord", "lvl 3 mümkün deyil, oyun baqlıdır"),
    ("A-SKILL-03", "az", "in_game", "Səviyyə 3 çox çətindir."),
    ("A-SKILL-03", "az", "discord", "kanyon səviyyəsində eyni yerdə 40 dəfə öldüm, bu nə zibildir"),
    ("A-SKILL-03", "ru", "discord", "3 уровень невозможно пройти, кто это делал?"),
    ("A-SKILL-03", "ru", "steam_review", "Thorn Canyon сломан, прыжки нечестные. Бросил игру."),
    ("A-SKILL-03", "ru", "discord", "уровень 3 — баг на баге, невозможно"),
    ("A-SKILL-03", "ru", "in_game", "Уровень 3 слишком сложный."),
    ("A-SKILL-03", "ru", "discord", "на каньоне умираю на одном и том же прыжке, игра кривая"),
    ("A-SKILL-03", "mixed", "discord", "level 3 невозможно, bu nə oyundur"),
    ("A-SKILL-03", "mixed", "discord", "Thorn Canyon çox çətin, просто impossible"),
    ("A-SKILL-03", "en", "steam_review", "Level 3 needs a nerf, way harder than anything before it."),
    ("A-SKILL-03", "en", "discord", "skill issue? nah level 3 is just broken"),

    # ---------------- A-SKILL-05  L5 timer (9) ----------------
    ("A-SKILL-05", "en", "discord", "The Clocktower timer is too short, impossible to make it."),
    ("A-SKILL-05", "en", "steam_review", "Level 5 timer is unfair, you need perfect runs."),
    ("A-SKILL-05", "en", "in_game", "level 5 timer too strict"),
    ("A-SKILL-05", "az", "discord", "5-ci səviyyədə vaxt çox azdır, çatdırmaq olmur"),
    ("A-SKILL-05", "az", "steam_review", "Clocktower-də taymer ədalətsizdir."),
    ("A-SKILL-05", "ru", "discord", "На 5 уровне таймер слишком маленький, не успеть."),
    ("A-SKILL-05", "ru", "in_game", "Уровень 5: таймер нереальный."),
    ("A-SKILL-05", "mixed", "discord", "Clocktower timer çox qısadır, не успеваю"),
    ("A-SKILL-05", "en", "discord", "pls add more time on level 5, can't do it"),

    # ---------------- NOISE (60) ----------------
    # toxicity
    ("NOISE", "en", "discord", "devs are clowns"),
    ("NOISE", "en", "discord", "worst game ever lmao uninstall"),
    ("NOISE", "en", "steam_review", "trash"),
    ("NOISE", "az", "discord", "bu oyunu edənlər nə düşünürdü ümumiyyətlə 🤡"),
    ("NOISE", "az", "discord", "zibil oyun"),
    ("NOISE", "ru", "discord", "разрабы криворукие"),
    ("NOISE", "ru", "steam_review", "мусор"),
    ("NOISE", "en", "discord", "L + ratio + bad game"),
    ("NOISE", "ru", "discord", "кто вообще в это играет"),
    ("NOISE", "az", "discord", "pulumu qaytarın"),
    ("NOISE", "en", "discord", "ok this game sucks"),
    ("NOISE", "mixed", "discord", "devs отдыхают, oyun zibildir"),
    # feature requests / off-topic
    ("NOISE", "en", "discord", "Please add co-op mode!"),
    ("NOISE", "en", "discord", "when is the DLC coming out?"),
    ("NOISE", "en", "steam_review", "Would love a controller remapping option."),
    ("NOISE", "az", "discord", "Azərbaycan dili əlavə edin zəhmət olmasa"),
    ("NOISE", "az", "discord", "multiplayer olacaq?"),
    ("NOISE", "ru", "discord", "Добавьте фоторежим, пожалуйста"),
    ("NOISE", "ru", "discord", "Когда выйдет на Switch?"),
    ("NOISE", "en", "discord", "can we get a hard mode after beating the game?"),
    ("NOISE", "en", "discord", "the soundtrack on Spotify when?"),
    ("NOISE", "az", "discord", "yeni skin olacaq?"),
    ("NOISE", "ru", "discord", "Будет ли поддержка Steam Deck?"),
    ("NOISE", "en", "in_game", "add a level select menu"),
    ("NOISE", "mixed", "discord", "co-op əlavə edin, с другом хочу играть"),
    ("NOISE", "en", "discord", "anyone want to team up for speedruns?"),
    # praise
    ("NOISE", "en", "steam_review", "Beautiful art, great music. Loving it so far."),
    ("NOISE", "en", "discord", "Frost Keep music is a banger"),
    ("NOISE", "en", "discord", "just finished level 8, that was awesome"),
    ("NOISE", "az", "steam_review", "Çox gözəl oyundur, qrafika əladır."),
    ("NOISE", "az", "discord", "Sunken Road səviyyəsi super idi 🔥"),
    ("NOISE", "ru", "steam_review", "Отличная игра, атмосфера супер."),
    ("NOISE", "ru", "discord", "8 уровень шикарный"),
    ("NOISE", "en", "steam_review", "Best platformer I've played this year."),
    ("NOISE", "en", "discord", "the new 1.4 menu looks clean"),
    ("NOISE", "az", "discord", "devlərə təşəkkürlər, çox zövq aldım"),
    ("NOISE", "ru", "discord", "спасибо разработчикам, отличный патч в целом"),
    ("NOISE", "en", "in_game", "love the boss designs"),
    ("NOISE", "mixed", "discord", "Ember Throne final boss эпичный, super idi"),
    ("NOISE", "en", "discord", "level 10 ending made me cry ngl"),
    # pricing / account / publisher (review-bomb style, not bugs)
    ("NOISE", "en", "steam_review", "Price went up in my region overnight. Not cool."),
    ("NOISE", "en", "steam_review", "Negative until they remove the launcher requirement."),
    ("NOISE", "az", "steam_review", "Regional qiymət çox bahadır."),
    ("NOISE", "ru", "steam_review", "Цена для нашего региона завышена."),
    ("NOISE", "en", "steam_review", "Thumbs down because of the new account login requirement."),
    ("NOISE", "ru", "steam_review", "Минус за обязательный аккаунт издателя."),
    ("NOISE", "az", "steam_review", "Hesab yaratmağı məcburi etdilər, pis qərar."),
    ("NOISE", "en", "discord", "why do I need an online account for a single-player game"),
    ("NOISE", "en", "steam_review", "Downvoting because of the publisher's statement on social media."),
    ("NOISE", "ru", "discord", "верните старую цену"),
    # vague, not actionable
    ("NOISE", "en", "discord", "game is so buggy"),
    ("NOISE", "en", "steam_review", "Lots of bugs."),
    ("NOISE", "az", "discord", "çox baq var"),
    ("NOISE", "ru", "discord", "игра вся в багах"),
    ("NOISE", "en", "discord", "something is off after the update"),
    ("NOISE", "en", "in_game", "fix bugs"),
    ("NOISE", "az", "in_game", "baqları düzəldin"),
    ("NOISE", "ru", "in_game", "исправьте баги"),
    ("NOISE", "mixed", "discord", "update-dən sonra hər şey qəribədir"),
    ("NOISE", "en", "discord", "feels laggy sometimes"),
]

# ---------------------------------------------------------------------------
# SCENARIO B  - "Hollow Harbor", co-op survival shooter, 8 missions, patch 2.1
# HELD-OUT: do not tune prompts on this one.
# ---------------------------------------------------------------------------
B_GAME = {
    "scenario": "B",
    "game": "Hollow Harbor (fictional)",
    "genre": "co-op survival shooter, 1-4 players",
    "unit": "mission",
    "previous_patch": "2.0",
    "current_patch": "2.1",
    "patch_date": "2026-10-01",
    "levels": {
        "1": "Dockside",
        "2": "Silent Warehouse (stealth)",
        "3": "Flooded Market",
        "4": "Lighthouse",
        "5": "Cargo Lift",
        "6": "Storm Pier",
        "7": "Harbor Master",
        "8": "Last Ferry",
    },
    "patch_notes_2_1": [
        "Loot table rebalance",
        "Netcode improvements for moving platforms",
        "Mission scripting fixes",
        "New weapon skins",
    ],
}

B_TELEMETRY = [
    (1, .95, .95, 0.8, 0.8, 1.0, 1.0, 5, 6, 8, 8),
    (2, .83, .82, 2.9, 3.0, 1.5, 1.5, 3, 3, 15, 15),
    (3, .82, .64, 3.0, 5.7, 1.4, 2.3, 4, 4, 17, 24),
    (4, .86, .86, 1.7, 1.7, 1.1, 1.1, 2, 2, 12, 12),
    (5, .84, .58, 1.6, 1.6, 1.2, 2.1, 9, 388, 10, 10),
    (6, .71, .70, 4.4, 4.5, 1.7, 1.7, 3, 3, 19, 19),
    (7, .76, .19, 1.9, 1.8, 1.3, 3.4, 4, 5, 14, 26),
    (8, .80, .79, 2.6, 2.6, 1.4, 1.4, 3, 3, 21, 21),
]
B_STARTERS = {"2.0": 5900, "2.1": 6200}

B_ISSUES = [
    {"issue_id": "B-ISS-01", "category": "bug", "level": 5,
     "title": "Co-op partner desyncs and disconnects on the Cargo Lift elevator, since 2.1"},
    {"issue_id": "B-ISS-02", "category": "balance", "level": 3,
     "title": "Ammo drops in Flooded Market reduced too much in 2.1"},
    {"issue_id": "B-ISS-03", "category": "bug", "level": 7,
     "title": "Harbor Master key item never spawns after the cutscene - soft lock"},
    {"issue_id": "B-ISS-04", "category": "bug", "level": 4,
     "title": "Flashlight key stops working after remapping controls (Lighthouse) - no telemetry signal"},
    {"issue_id": "B-SKILL-02", "category": "skill_issue", "level": 2,
     "title": "'Stealth is impossible' complaints - telemetry normal, NOT a real issue"},
    {"issue_id": "B-SKILL-06", "category": "skill_issue", "level": 6,
     "title": "'Storm Pier too hard' complaints - telemetry normal, NOT a real issue"},
    {"issue_id": "NOISE", "category": "noise", "level": None,
     "title": "Toxicity, feature requests, praise, pricing/account complaints, vague posts"},
]

B_MESSAGES = [
    # B-ISS-01  M5 elevator desync (10)
    ("B-ISS-01", "en", "discord", "Every time we take the cargo lift in mission 5 my friend gets disconnected."),
    ("B-ISS-01", "en", "steam_review", "Co-op is broken on Cargo Lift since 2.1. Partner desyncs at the elevator and drops from the session."),
    ("B-ISS-01", "az", "discord", "5-ci missiyada liftə minəndə dostum oyundan atılır."),
    ("B-ISS-01", "az", "steam_review", "Cargo Lift-də co-op işləmir, lift hərəkət edən kimi ikinci oyunçu disconnect olur."),
    ("B-ISS-01", "ru", "discord", "На 5 миссии на лифте напарника выкидывает из игры."),
    ("B-ISS-01", "ru", "steam_review", "Кооп сломан на Cargo Lift: на лифте рассинхрон и дисконнект."),
    ("B-ISS-01", "mixed", "discord", "mission 5 lift-də dostumu кикает, 2.1-dən sonra"),
    ("B-ISS-01", "en", "in_game", "partner disconnected at elevator mission 5"),
    ("B-ISS-01", "ru", "in_game", "Миссия 5, лифт — дисконнект напарника."),
    ("B-ISS-01", "en", "discord", "Love how the 2.1 elevator is a solo-only experience now. Co-op game btw"),
    # B-ISS-02  M3 ammo (9)
    ("B-ISS-02", "en", "discord", "Ammo drops in Flooded Market are way too low after 2.1, running dry halfway."),
    ("B-ISS-02", "en", "steam_review", "Mission 3 became a slog, the ammo nerf went too far."),
    ("B-ISS-02", "az", "discord", "3-cü missiyada patron demək olar ki, düşmür, yarıda bitir."),
    ("B-ISS-02", "az", "steam_review", "Flooded Market-də 2.1-dən sonra güllə çatmır, hər dəfə ölürük."),
    ("B-ISS-02", "ru", "discord", "На 3 миссии после 2.1 патронов почти нет."),
    ("B-ISS-02", "ru", "steam_review", "Flooded Market стал невозможным — патроны кончаются на середине."),
    ("B-ISS-02", "mixed", "discord", "Flooded Market патронов нет, ammo nerf çox pisdir"),
    ("B-ISS-02", "en", "in_game", "mission 3 not enough ammo"),
    ("B-ISS-02", "ru", "discord", "верните патроны на 3 миссии, умираем каждый раз"),
    # B-ISS-03  M7 key never spawns (10)
    ("B-ISS-03", "en", "discord", "The harbor master's key never spawns in mission 7, can't open the gate. Soft locked."),
    ("B-ISS-03", "en", "steam_review", "Mission 7 is unbeatable right now: the key item doesn't appear after the cutscene."),
    ("B-ISS-03", "az", "discord", "7-ci missiyada açar çıxmır, qapını açmaq olmur, irəli getmək mümkün deyil."),
    ("B-ISS-03", "az", "steam_review", "Harbor Master missiyasında lazım olan açar ümumiyyətlə yaranmır."),
    ("B-ISS-03", "ru", "discord", "На 7 миссии не появляется ключ начальника порта, дальше не пройти."),
    ("B-ISS-03", "ru", "steam_review", "Миссия 7 непроходима: ключ после катсцены не спавнится."),
    ("B-ISS-03", "mixed", "discord", "Harbor Master açar yoxdur, ключ не появляется"),
    ("B-ISS-03", "en", "in_game", "key missing mission 7 stuck"),
    ("B-ISS-03", "az", "in_game", "Missiya 7, açar yoxdur"),
    ("B-ISS-03", "en", "discord", "Tried reloading 3 times, the mission 7 key is just not there"),
    # B-ISS-04  M4 flashlight remap bug, no telemetry signal (6)
    ("B-ISS-04", "en", "discord", "After remapping controls the flashlight key does nothing in the Lighthouse mission. Default keys work."),
    ("B-ISS-04", "en", "steam_review", "Remapped my keys and now I can't turn on the flashlight in mission 4. Had to reset all bindings."),
    ("B-ISS-04", "az", "discord", "Düymələri dəyişəndən sonra 4-cü missiyada fənər yanmır. Standart düymələrlə işləyir."),
    ("B-ISS-04", "ru", "discord", "После переназначения клавиш фонарик на 4 миссии не включается."),
    ("B-ISS-04", "ru", "in_game", "Маяк (миссия 4): фонарик не работает после смены управления."),
    ("B-ISS-04", "mixed", "discord", "Lighthouse missiyasında fənər rebind-dən sonra не работает"),
    # B-SKILL-02  M2 stealth (9)
    ("B-SKILL-02", "en", "discord", "Silent Warehouse stealth is impossible, guards see through walls."),
    ("B-SKILL-02", "en", "steam_review", "Mission 2 detection is broken, I get spotted instantly."),
    ("B-SKILL-02", "az", "discord", "2-ci missiyada gizlənmək mümkün deyil, mühafizəçilər hər şeyi görür."),
    ("B-SKILL-02", "ru", "discord", "Стелс на 2 миссии невозможный, охрана видит сквозь стены."),
    ("B-SKILL-02", "ru", "steam_review", "Silent Warehouse — сломанный стелс."),
    ("B-SKILL-02", "mixed", "discord", "mission 2 stealth невозможно, çox çətindir"),
    ("B-SKILL-02", "en", "in_game", "mission 2 too hard"),
    ("B-SKILL-02", "az", "steam_review", "Silent Warehouse çox çətindir."),
    ("B-SKILL-02", "en", "discord", "guards in mission 2 are psychic lol"),
    # B-SKILL-06  M6 'too hard' (6)
    ("B-SKILL-06", "en", "discord", "Storm Pier is way too hard."),
    ("B-SKILL-06", "az", "discord", "6-cı missiya çox çətindir"),
    ("B-SKILL-06", "ru", "discord", "Шторм на пирсе слишком сложный."),
    ("B-SKILL-06", "en", "steam_review", "Mission 6 difficulty spike is unfair."),
    ("B-SKILL-06", "ru", "in_game", "Миссия 6 слишком сложная."),
    ("B-SKILL-06", "mixed", "discord", "Storm Pier çox çətin, impossible"),
    # NOISE (16)
    ("NOISE", "en", "discord", "add crossplay pls"),
    ("NOISE", "en", "steam_review", "Great co-op fun with friends."),
    ("NOISE", "az", "discord", "oyun əladır, dostlarla oynayırıq"),
    ("NOISE", "ru", "discord", "когда новая карта?"),
    ("NOISE", "en", "steam_review", "Overpriced for the content."),
    ("NOISE", "ru", "steam_review", "отличная игра"),
    ("NOISE", "az", "discord", "zibil"),
    ("NOISE", "en", "discord", "devs please add a hard mode"),
    ("NOISE", "en", "discord", "lots of bugs lol"),
    ("NOISE", "ru", "discord", "много багов"),
    ("NOISE", "en", "steam_review", "Downvote because of the forced account."),
    ("NOISE", "az", "steam_review", "qiymət bahadır"),
    ("NOISE", "en", "in_game", "love the soundtrack"),
    ("NOISE", "ru", "discord", "разрабы молодцы"),
    ("NOISE", "mixed", "discord", "LFG mission 8, кто со мной?"),
    ("NOISE", "en", "discord", "the ferry ending was great"),
]


def build_telemetry(rows, starters, prev, cur):
    out = []
    for patch, idx_c, idx_d, idx_r, idx_e, idx_m in [
        (prev, 1, 3, 5, 7, 9),
        (cur, 2, 4, 6, 8, 10),
    ]:
        started = starters[patch]
        for r in rows:
            comp = r[idx_c]
            completed = round(started * comp)
            out.append({
                "patch": patch,
                "level": r[0],
                "players_started": started,
                "players_completed": completed,
                "completion_rate": comp,
                "deaths_per_player": r[idx_d],
                "restarts_per_player": r[idx_r],
                "error_reports": r[idx_e],
                "median_minutes": r[idx_m],
            })
            started = round(completed * 0.96)  # 4% stop playing between levels
    return out


def impact_by_level(telemetry, prev, cur):
    """Players who would have finished the level under the previous patch but did not."""
    t = {(row["patch"], row["level"]): row for row in telemetry}
    levels = sorted({row["level"] for row in telemetry})
    return {
        lv: round(t[(cur, lv)]["players_started"] * max(0.0, t[(prev, lv)]["completion_rate"] - t[(cur, lv)]["completion_rate"]))
        for lv in levels
    }


def level_of(issue_id, issues):
    for i in issues:
        if i["issue_id"] == issue_id:
            return i["level"], i["category"]
    raise KeyError(issue_id)


def write_scenario(name, game, messages, issues, tele_rows, starters, prev, cur, patch_date, dev_share, rng):
    d = ROOT / "data" / f"scenario_{name}"
    d.mkdir(parents=True, exist_ok=True)

    telemetry = build_telemetry(tele_rows, starters, prev, cur)
    with open(d / "telemetry.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(telemetry[0].keys()))
        w.writeheader()
        w.writerows(telemetry)

    impact = impact_by_level(telemetry, prev, cur)
    real = [i for i in issues if i["category"] in ("bug", "balance")]
    # ground-truth priority: players lost (impact); ties / zero-impact cosmetic issues last
    real_sorted = sorted(real, key=lambda i: -impact[i["level"]])
    for rank, i in enumerate(real_sorted, 1):
        i["priority_rank"] = rank
        i["players_lost_estimate"] = impact[i["level"]]
    for i in issues:
        i.setdefault("priority_rank", None)
        i.setdefault("players_lost_estimate", impact.get(i["level"]) if i["level"] else None)
        i["message_count"] = sum(1 for m in messages if m[0] == i["issue_id"])

    with open(d / "game_info.json", "w", encoding="utf-8") as f:
        json.dump(game, f, ensure_ascii=False, indent=2)

    # shuffle, assign ids, timestamps, dev/test split (stratified by issue)
    msgs = list(messages)
    rng.shuffle(msgs)
    by_issue = {}
    for m in msgs:
        by_issue.setdefault(m[0], []).append(m)
    dev_set = set()
    if dev_share > 0:
        for iid, group in by_issue.items():
            k = max(1, round(len(group) * dev_share))
            for m in group[:k]:
                dev_set.add(id(m))

    start = datetime.fromisoformat(patch_date + "T10:00:00")
    stamped = [(start + timedelta(minutes=rng.randint(30, 7 * 24 * 60)), m) for m in msgs]
    stamped.sort(key=lambda x: x[0])
    rows_public, rows_key = [], []
    for n, (ts, m) in enumerate(stamped, 1):
        issue_id, lang, channel, text = m
        mid = f"{name}{n:03d}"
        author = hashlib.sha1(f"{SEED}-{name}-{n}-{rng.random()}".encode()).hexdigest()[:10]
        lv, cat = level_of(issue_id, issues)
        split = "dev" if id(m) in dev_set else ("test" if dev_share > 0 else "heldout")
        rows_public.append({"id": mid, "timestamp": ts.isoformat(timespec="minutes"), "channel": channel,
                            "author": f"player_{author}", "text": text})
        rows_key.append({"id": mid, "split": split, "issue_id": issue_id, "category": cat,
                         "level": "" if lv is None else lv, "language": lang, "channel": channel})

    with open(d / "messages.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "timestamp", "channel", "author", "text"])
        w.writeheader()
        w.writerows(rows_public)

    key_dir = ROOT / "answer_key"
    key_dir.mkdir(exist_ok=True)
    with open(key_dir / f"scenario_{name}_labels.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "split", "issue_id", "category", "level", "language", "channel"])
        w.writeheader()
        w.writerows(rows_key)
    with open(key_dir / f"scenario_{name}_issues.json", "w", encoding="utf-8") as f:
        json.dump({"scenario": name, "previous_patch": prev, "current_patch": cur,
                   "priority_definition": "players_lost_estimate = players_started(current patch) x drop in completion_rate vs previous patch; real issues ranked by it, highest first",
                   "issues": issues}, f, ensure_ascii=False, indent=2)
    return len(msgs)


def main():
    rng = random.Random(SEED)
    na = write_scenario("A", A_GAME, A_MESSAGES, A_ISSUES, A_TELEMETRY, A_STARTERS, "1.3", "1.4",
                        A_GAME["patch_date"], dev_share=0.25, rng=rng)
    nb = write_scenario("B", B_GAME, B_MESSAGES, B_ISSUES, B_TELEMETRY, B_STARTERS, "2.0", "2.1",
                        B_GAME["patch_date"], dev_share=0.0, rng=rng)
    print(f"scenario A: {na} messages, scenario B: {nb} messages")


if __name__ == "__main__":
    main()

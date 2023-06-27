const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todoListDB", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to do list!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

/*   */

app.get("/", function (req, res) {

    Item.find({}).then(function (foundItems) {

        if (foundItems.length === 0) {

            Item.insertMany(defaultItems)
                .then(function () {
                    console.log("Successfully saved default items to DB!");
                })
                .catch(function (err) {
                    console.log(err);
                });

            res.redirect("/");

        }
        else {

            res.render("list", { listTitle: "Today", newListItems: foundItems });

        }



    })
        .catch(function (err) {
            console.log(err);
        });

});

app.get("/:customListName", function (req, res) {
    const customListName = req.params.customListName;

    List.findOne({ name: customListName })
        .then(function (foundList) {

            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                console.log("saved");
                res.redirect("/" + customListName);
            }
            else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(function (err) { });
})


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        Name: itemName
    })

    if (listName === "Today") {
        item.save();
        res.redirect("/");

    } else {
        List.findOne({ Name: listName })
            .then(function (foundList) {
                foundList.Items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err)
            });
    }
});

app.post("/delete", function (req, res) {

    const listName = req.body.listName;
    const checkItemId = req.body.checkbox;

    if (listName == "Today") {
        deleteCheckedItem();
    } else {

        deleteCustomItem();
    }

    async function deleteCheckedItem() {
        await Item.deleteOne({ _id: checkItemId });
        res.redirect("/");
    }

    async function deleteCustomItem() {
        await List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkItemId } } }
        );
        res.redirect("/" + listName);
    }
});



app.get("/about", function () {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
